"""Tests unitaires pour products_service : tri "meilleur deal" et pagination.

Isoles de la DB par monkeypatch sur products_repository (seule la couche
repositories touche la DB - ces tests ne construisent jamais de session
reelle, `session` est passe en `None`).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.errors import ProductNotFoundError
from app.repositories import products_repository
from app.services.products_service import PRICE_HISTORY_LOOKBACK_DAYS, get_product_detail, search_products
from tests.factories import make_offer, make_product


def test_search_products_orders_results_by_best_deal_score(monkeypatch: pytest.MonkeyPatch) -> None:
    p1 = make_product(id="p1", offers=[make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")])
    p2 = make_product(id="p2", offers=[make_offer(price="50", shipping_cost=None, trust_score=3.0, stock_status="in_stock")])
    p3 = make_product(id="p3", offers=[make_offer(price="200", shipping_cost=None, trust_score=3.0, stock_status="in_stock")])

    monkeypatch.setattr(products_repository, "search_products_candidates", lambda *a, **kw: [p1, p3, p2])

    result = search_products(None, query="x", category=None, limit=10, offset=0)

    assert [r.product.id for r in result] == ["p2", "p1", "p3"]


def test_search_products_paginates_after_sorting_not_before(monkeypatch: pytest.MonkeyPatch) -> None:
    products = [
        make_product(id="p1", offers=[make_offer(price="500", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]),
        make_product(id="p2", offers=[make_offer(price="400", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]),
        make_product(id="p3", offers=[make_offer(price="300", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]),
        make_product(id="p4", offers=[make_offer(price="200", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]),
        make_product(id="p5", offers=[make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]),
    ]
    monkeypatch.setattr(products_repository, "search_products_candidates", lambda *a, **kw: products)

    # Ordre trie croissant par score : p5, p4, p3, p2, p1. offset=2 doit donc
    # ramener [p3, p2], pas les produits 3-4 de l'ordre brut du repository.
    result = search_products(None, query=None, category=None, limit=2, offset=2)

    assert [r.product.id for r in result] == ["p3", "p2"]


def test_search_products_result_includes_correct_offers_count(monkeypatch: pytest.MonkeyPatch) -> None:
    product = make_product(
        id="p1",
        offers=[
            make_offer(id="o1", price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock"),
            make_offer(id="o2", price="110", shipping_cost=None, trust_score=3.0, stock_status="in_stock"),
            make_offer(id="o3", price="120", shipping_cost=None, trust_score=3.0, stock_status="in_stock"),
        ],
    )
    monkeypatch.setattr(products_repository, "search_products_candidates", lambda *a, **kw: [product])

    result = search_products(None, query=None, category=None, limit=10, offset=0)

    assert result[0].offers_count == 3


def test_get_product_detail_best_deal_is_first_of_sorted_offers(monkeypatch: pytest.MonkeyPatch) -> None:
    cheap = make_offer(id="o-cheap", price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    mid = make_offer(id="o-mid", price="200", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    pricey = make_offer(id="o-pricey", price="300", shipping_cost=None, trust_score=3.0, stock_status="in_stock")
    product = make_product(id="p1", offers=[pricey, cheap, mid])

    monkeypatch.setattr(products_repository, "get_product_by_id", lambda *a, **kw: product)
    monkeypatch.setattr(products_repository, "get_price_history_for_product", lambda *a, **kw: [])

    detail = get_product_detail(None, "p1")

    assert detail.best_deal is detail.offers[0]
    assert [o.id for o in detail.offers] == ["o-cheap", "o-mid", "o-pricey"]


def test_get_product_detail_raises_product_not_found_when_repo_returns_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(products_repository, "get_product_by_id", lambda *a, **kw: None)

    with pytest.raises(ProductNotFoundError):
        get_product_detail(None, "missing-id")


def test_get_product_detail_passes_90_day_lookback_to_repository(monkeypatch: pytest.MonkeyPatch) -> None:
    product = make_product(
        id="p1", offers=[make_offer(price="100", shipping_cost=None, trust_score=3.0, stock_status="in_stock")]
    )
    monkeypatch.setattr(products_repository, "get_product_by_id", lambda *a, **kw: product)

    captured: dict[str, datetime] = {}

    def fake_get_price_history(session, product_id, *, since):
        captured["since"] = since
        return []

    monkeypatch.setattr(products_repository, "get_price_history_for_product", fake_get_price_history)

    get_product_detail(None, "p1")

    expected_since = datetime.now(UTC) - timedelta(days=PRICE_HISTORY_LOOKBACK_DAYS)
    assert abs((captured["since"] - expected_since).total_seconds()) < 5
