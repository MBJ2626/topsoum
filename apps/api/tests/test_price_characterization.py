"""Tests de caracterisation (pas de DB) : score "Meilleur prix" et prix douteux ou absent.

Ils figent le comportement observe le 2026-10-03, y compris quand il s'ecarte
d'une regle documentee : ces cas sont signales "ECART" dans leur docstring.
Corriger l'un d'eux doit faire echouer le test correspondant, a mettre a jour
avec la correction.

La regle "Prix en cours de mise a jour" (docs/PROJET.md 5.4 et 9.2) n'a pas de
libelle cote API : l'API renvoie le prix tel quel et le web l'affiche via
displayPrice (apps/web/lib/format.ts).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

import pytest

from app.controllers.products_controller import search_products_controller
from app.repositories import products_repository
from app.services.favorites_service import to_result
from app.services.products_service import _top_item, get_product_detail, search_products
from app.services.scoring import best_offer, score_offer
from tests.factories import make_favorite, make_offer, make_product


def _offer(price: str, *, stock: str = "in_stock", trust: float | None = 3.0, shipping: str | None = None, id: str = "o1"):
    return make_offer(id=id, price=price, shipping_cost=shipping, trust_score=trust, stock_status=stock, vendor_id=f"v-{id}")


# -- Score "Meilleur prix" : valeurs exactes ----------------------------------


@pytest.mark.parametrize(
    ("price", "shipping", "trust", "stock", "expected"),
    [
        # cout x (1 - 0.05 x trust/5) x penalite de stock
        ("100", None, 3.0, "in_stock", 97.0),
        ("100", "7", 3.0, "in_stock", 103.79),
        ("100", None, 5.0, "in_stock", 95.0),
        ("100", None, 0.0, "in_stock", 100.0),
        ("100", None, None, "in_stock", 97.0),  # trust absent -> 3.0
        ("100", None, 9.0, "in_stock", 95.0),  # trust borne a 5
        ("100", None, -2.0, "in_stock", 100.0),  # trust borne a 0
        ("100", None, 3.0, "unknown", 106.7),
        ("100", None, 3.0, "out_of_stock", 145.5),
        ("100", None, 3.0, "preorder", 106.7),  # statut inconnu -> penalite 1.1
        ("0", None, 3.0, "in_stock", 0.0),
    ],
)
def test_score_offer_exact_values(price, shipping, trust, stock, expected) -> None:
    assert score_offer(_offer(price, shipping=shipping, trust=trust, stock=stock)) == pytest.approx(expected)


def test_best_offer_keeps_first_offer_on_exact_tie() -> None:
    first = _offer("100", id="a")
    second = _offer("100", id="b")
    assert best_offer([first, second]) is first
    assert best_offer([second, first]) is second


def test_shipping_cost_can_flip_the_best_deal() -> None:
    cheap_with_shipping = _offer("100", shipping="15", id="a")
    pricier_free_shipping = _offer("110", id="b")
    assert best_offer([cheap_with_shipping, pricier_free_shipping]) is pricier_free_shipping


def test_unknown_stock_loses_to_in_stock_up_to_ten_percent_more_expensive() -> None:
    unknown = _offer("100", stock="unknown", id="a")
    assert best_offer([unknown, _offer("109", id="b")]).id == "b"
    assert best_offer([unknown, _offer("111", id="c")]).id == "a"


def test_out_of_stock_wins_when_much_cheaper_than_in_stock() -> None:
    """ECART : le docstring de scoring.py annonce qu'une offre out_of_stock n'est
    choisie que s'il n'existe aucune offre en stock. En realite la penalite est
    un multiplicateur 1.5 : une rupture plus de ~33 % moins chere l'emporte."""
    out_of_stock = _offer("90", stock="out_of_stock", id="a")
    in_stock = _offer("140", id="b")
    assert best_offer([out_of_stock, in_stock]) is out_of_stock


# -- Prix douteux (0) ou absent -------------------------------------------------


def test_zero_price_offer_becomes_best_deal_in_search(monkeypatch: pytest.MonkeyPatch) -> None:
    """ECART : la recherche ne filtre pas les prix <= 0 (contrairement au top 5) :
    une offre a 0 TND est le "Meilleur prix" et remonte le produit en tete."""
    zero = make_product(id="p-zero", offers=[_offer("0", id="z"), _offer("500", id="y")])
    normal = make_product(id="p-normal", offers=[_offer("100", id="n")])
    monkeypatch.setattr(products_repository, "search_products_candidates", lambda *a, **kw: [normal, zero])

    results = search_products(None, query="x", category=None, limit=10, offset=0)

    assert [r.product.id for r in results] == ["p-zero", "p-normal"]
    assert results[0].best_deal.price == Decimal("0")
    assert results[0].offers_count == 2


def test_zero_price_is_serialized_as_is_by_the_search_controller(monkeypatch: pytest.MonkeyPatch) -> None:
    """L'API ne remplace pas un prix nul : le libelle d'attente est l'affaire du web."""
    offer = _offer("0.000", id="z")
    offer.scraped_at = datetime(2026, 10, 3, 8, 0, 0)
    product = make_product(id="p-zero", offers=[offer])
    monkeypatch.setattr(products_repository, "search_products_candidates", lambda *a, **kw: [product])

    response = search_products_controller(None, query="x", category=None, limit=10, offset=0)

    assert response.model_dump(mode="json")["results"][0]["best_deal"]["price"] == "0.000"


def test_zero_price_offer_becomes_best_deal_in_product_detail(monkeypatch: pytest.MonkeyPatch) -> None:
    """ECART : meme comportement que la recherche sur la fiche produit."""
    product = make_product(id="p1", offers=[_offer("450", id="a"), _offer("0", id="b")])
    monkeypatch.setattr(products_repository, "get_product_by_id", lambda *a, **kw: product)
    monkeypatch.setattr(products_repository, "get_price_history_for_product", lambda *a, **kw: [])

    detail = get_product_detail(None, "p1")

    assert detail.best_deal.id == "b"
    assert [o.id for o in detail.offers] == ["b", "a"]


def test_product_detail_without_offers_raises_index_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """ECART : une fiche sans aucune offre leve IndexError (500) au lieu d'un etat
    "Prix en cours de mise a jour"."""
    product = make_product(id="p1", offers=[])
    monkeypatch.setattr(products_repository, "get_product_by_id", lambda *a, **kw: product)
    monkeypatch.setattr(products_repository, "get_price_history_for_product", lambda *a, **kw: [])

    with pytest.raises(IndexError):
        get_product_detail(None, "p1")


def test_favorite_without_offers_has_no_price() -> None:
    favorite = make_favorite(product=make_product(offers=[]))
    result = to_result(favorite)
    assert (result.best_offer_price, result.best_offer_vendor) == (None, None)


def test_favorite_best_price_can_be_zero() -> None:
    """ECART : les favoris non plus ne filtrent pas un prix nul."""
    favorite = make_favorite(product=make_product(offers=[_offer("0", id="a"), _offer("300", id="b")]))
    assert to_result(favorite).best_offer_price == Decimal("0")


def test_top_item_skips_products_with_only_zero_prices() -> None:
    """Seul le top 5 ecarte les prix <= 0."""
    assert _top_item(make_product(offers=[_offer("0", id="a")]), None) is None
