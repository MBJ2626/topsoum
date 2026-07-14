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


def test_search_returns_offers_sorted_by_price() -> None:
    response = client.get("/products/search")
    assert response.status_code == 200

    body = response.json()
    assert body["count"] == len(body["results"])

    prices = [float(offer["price"]) for offer in body["results"]]
    assert prices == sorted(prices)


def test_search_filters_by_query() -> None:
    response = client.get("/products/search", params={"q": "does-not-exist-xyz"})
    assert response.status_code == 200
    assert response.json() == {"count": 0, "results": []}


def test_search_limit_is_enforced() -> None:
    response = client.get("/products/search", params={"limit": 1})
    assert response.status_code == 200
    assert len(response.json()["results"]) <= 1
