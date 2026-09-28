"""Smoke test d'integration contre la DB de dev (docker compose postgres).
Suppose que le scraper Tunisianet + le pipeline ETL ont deja charge des offres.
"""

from fastapi.testclient import TestClient

from sqlalchemy import text

from app.main import app
from app.repositories.database import SessionLocal
from tests.conftest import SeededCatalog

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


def test_get_product_detail_returns_offers_and_history(seeded_catalog: SeededCatalog) -> None:
    product_id = seeded_catalog.product_ids[0]

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


def test_search_matches_every_word_in_any_order(seeded_catalog: SeededCatalog) -> None:
    tag = seeded_catalog.tag
    for query in (f"{tag} alpha noir", f"noir {tag} alpha", f"testbrand {tag} alpha"):
        response = client.get("/products/search", params={"q": query})
        assert response.status_code == 200
        ids = [result["id"] for result in response.json()["results"]]
        assert ids == [seeded_catalog.product_ids[0]], query


def test_search_requires_all_words(seeded_catalog: SeededCatalog) -> None:
    response = client.get("/products/search", params={"q": f"{seeded_catalog.tag} alpha bleu"})
    assert response.json() == {"count": 0, "results": []}


def test_search_treats_like_wildcards_literally(seeded_catalog: SeededCatalog) -> None:
    response = client.get("/products/search", params={"q": f"{seeded_catalog.tag} %"})
    assert response.json() == {"count": 0, "results": []}


def test_search_numbers_match_whole_numbers_only(seeded_catalog: SeededCatalog) -> None:
    # Nombre entier en debut de mot : "16" trouve "16Go", "4" trouve "4Go", "6" ne trouve ni "16Go" ni "64Go".
    tag = seeded_catalog.tag
    alpha, beta, _ = seeded_catalog.product_ids
    assert [r["id"] for r in client.get("/products/search", params={"q": f"{tag} 16"}).json()["results"]] == [alpha]
    assert [r["id"] for r in client.get("/products/search", params={"q": f"{tag} 4"}).json()["results"]] == [beta]
    assert client.get("/products/search", params={"q": f"{tag} 6"}).json()["count"] == 0


def test_sitemap_lists_products_with_offers(seeded_catalog: SeededCatalog) -> None:
    response = client.get("/products/sitemap")
    assert response.status_code == 200

    body = response.json()
    assert body["count"] == len(body["results"])
    entries = {entry["id"]: entry for entry in body["results"]}
    for product_id in seeded_catalog.product_ids:
        assert product_id in entries
        # Fuseau explicite : sinon un client JS lirait l'heure UTC comme locale.
        assert entries[product_id]["last_modified"].endswith("+00:00")


def test_sitemap_excludes_products_without_offers(seeded_catalog: SeededCatalog) -> None:
    # Cas d'une fiche fusionnee par l'admin : ses offres ont ete deplacees.
    session = SessionLocal()
    try:
        session.execute(text("delete from offers where id = :id"), {"id": seeded_catalog.offer_ids[0]})
        session.commit()
    finally:
        session.close()

    ids = {entry["id"] for entry in client.get("/products/sitemap").json()["results"]}
    assert seeded_catalog.product_ids[0] not in ids
    assert seeded_catalog.product_ids[1] in ids
