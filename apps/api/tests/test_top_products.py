from __future__ import annotations

import datetime
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.repositories.database import SessionLocal
from app.services import products_service
from app.services.products_service import _top_item, get_top_products
from tests.conftest import SeededCatalog
from tests.factories import make_offer, make_product

client = TestClient(app)
NOW = datetime.datetime(2026, 10, 2, 12, 0)


def _offer(id: str, price: str, vendor: str):
    return make_offer(id=id, price=price, shipping_cost=None, trust_score=3.0, stock_status="in_stock", vendor_id=vendor)


def test_top_item_ignores_unpriced_offers_and_computes_spread() -> None:
    product = make_product(offers=[_offer("a", "100", "v1"), _offer("b", "130", "v2"), _offer("c", "0", "v3")])
    item = _top_item(product, None)
    assert item is not None
    assert item.offers_count == 2
    assert item.price_spread == 30
    assert item.best_deal.id == "a"


def test_most_compared_ranks_by_vendor_count_then_spread() -> None:
    three = make_product(id="three", offers=[_offer("t1", "100", "v1"), _offer("t2", "105", "v2"), _offer("t3", "110", "v3")])
    two_big_gap = make_product(id="gap", offers=[_offer("g1", "100", "v1"), _offer("g2", "200", "v2")])
    two_small_gap = make_product(id="small", offers=[_offer("s1", "100", "v1"), _offer("s2", "101", "v2")])
    single = make_product(id="single", offers=[_offer("x1", "100", "v1")])

    with (
        patch.object(products_service.product_events_repository, "first_event_at", return_value=None),
        patch.object(
            products_service.products_repository,
            "search_products_candidates",
            return_value=[single, two_small_gap, three, two_big_gap],
        ),
    ):
        top = get_top_products(None, limit=5, now=NOW)  # type: ignore[arg-type]

    assert top.mode == "most_compared"
    assert top.period_days is None
    assert [item.product.id for item in top.items] == ["three", "gap", "small"]


def test_most_viewed_needs_seven_days_of_data() -> None:
    with (
        patch.object(products_service.product_events_repository, "first_event_at", return_value=NOW - datetime.timedelta(days=6)),
        patch.object(products_service.products_repository, "search_products_candidates", return_value=[]),
    ):
        assert get_top_products(None, limit=5, now=NOW).mode == "most_compared"  # type: ignore[arg-type]


def test_most_viewed_ranking_from_real_events(seeded_catalog: SeededCatalog) -> None:
    session = SessionLocal()
    now = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    # Vues massives sur les produits de test pour dominer d'eventuelles vraies vues de la DB de dev.
    views = {seeded_catalog.product_ids[0]: 1000, seeded_catalog.product_ids[1]: 2000, seeded_catalog.product_ids[2]: 1500}
    try:
        session.execute(
            text("insert into product_events (id, product_id, type, created_at) values (:id, :pid, 'view', :at)"),
            [
                {"id": f"{pid}-{i}", "pid": pid, "at": now - datetime.timedelta(hours=1)}
                for pid, count in views.items()
                for i in range(count)
            ]
            + [{"id": f"{seeded_catalog.tag}-old", "pid": seeded_catalog.product_ids[0], "at": now - datetime.timedelta(days=8)}],
        )
        session.commit()

        top = get_top_products(session, limit=3, now=now)
        assert top.mode == "most_viewed"
        assert top.period_days == 7
        assert [item.product.id for item in top.items] == [
            seeded_catalog.product_ids[1],
            seeded_catalog.product_ids[2],
            seeded_catalog.product_ids[0],
        ]
        assert top.items[0].views == 2000
    finally:
        session.close()


def test_top_endpoint_structure() -> None:
    response = client.get("/products/top")
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] in ("most_viewed", "most_compared")
    assert len(body["results"]) <= 5
    for item in body["results"]:
        assert float(item["best_deal"]["price"]) > 0


def test_record_view_and_offer_click_persist_events(seeded_catalog: SeededCatalog) -> None:
    product_id = seeded_catalog.product_ids[0]
    assert client.post(f"/products/{product_id}/view").status_code == 204
    assert client.post("/products/does-not-exist/view").status_code == 404
    assert client.post(f"/offers/{seeded_catalog.offer_ids[0]}/click").status_code == 200

    session = SessionLocal()
    try:
        rows = session.execute(
            text("select type from product_events where product_id = :pid order by type"), {"pid": product_id}
        ).scalars().all()
        assert rows == ["offer_click", "view"]
    finally:
        session.close()
