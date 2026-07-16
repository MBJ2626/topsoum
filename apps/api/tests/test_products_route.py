"""Smoke test d'integration contre la DB de dev (docker compose postgres).
Suppose que le scraper Tunisianet + le pipeline ETL ont deja charge des offres.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_search_returns_grouped_products_sorted_by_best_deal() -> None:
    response = client.get("/products/search")
    assert response.status_code == 200

    body = response.json()
    assert body["count"] == len(body["results"])

    for result in body["results"]:
        assert "best_deal" in result
        assert "offers_count" in result
        assert result["offers_count"] >= 1


def test_search_filters_by_query() -> None:
    response = client.get("/products/search", params={"q": "does-not-exist-xyz"})
    assert response.status_code == 200
    assert response.json() == {"count": 0, "results": []}


def test_search_limit_is_enforced() -> None:
    response = client.get("/products/search", params={"limit": 1})
    assert response.status_code == 200
    assert len(response.json()["results"]) <= 1


def test_get_product_detail_returns_offers_and_history() -> None:
    search_response = client.get("/products/search", params={"limit": 1})
    product_id = search_response.json()["results"][0]["id"]

    response = client.get(f"/products/{product_id}")
    assert response.status_code == 200

    body = response.json()
    assert body["id"] == product_id
    assert len(body["offers"]) >= 1
    assert "best_deal" in body
    assert "price_history" in body


def test_get_product_detail_returns_404_for_unknown_id() -> None:
    response = client.get("/products/does-not-exist-xyz")
    assert response.status_code == 404
