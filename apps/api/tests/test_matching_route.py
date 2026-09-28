"""Integration contre la DB de dev. Les produits viennent de la fixture
seeded_catalog (catalogue isole, supprime apres chaque test) : ces tests
fusionnent et reassignent des offres, ils ne doivent jamais toucher aux
produits reels charges par l'ETL."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.repositories.database import SessionLocal
from tests.conftest import SeededCatalog, auth_headers

client = TestClient(app)


def _create_pending_match(*, created_product_id: str, candidate_product_id: str) -> str:
    match_id = str(uuid.uuid4())
    session = SessionLocal()
    try:
        session.execute(
            text(
                """
                insert into pending_matches
                    (id, vendor_slug, external_id, reference, offer_product_name, category,
                     created_product_id, candidate_product_id, confidence, strategy, status, created_at)
                values
                    (:id, 'tunisianet', 'ext-1', null, 'Produit de test', 'smartphones',
                     :created_product_id, :candidate_product_id, 0.7, 'fuzzy', 'pending', now())
                """
            ),
            {"id": match_id, "created_product_id": created_product_id, "candidate_product_id": candidate_product_id},
        )
        session.commit()
    finally:
        session.close()
    return match_id


def _cleanup(match_id: str) -> None:
    session = SessionLocal()
    try:
        session.execute(text("delete from manual_overrides where vendor_slug = 'tunisianet' and external_id = 'ext-1'"))
        session.execute(text("delete from pending_matches where id = :id"), {"id": match_id})
        session.commit()
    finally:
        session.close()


def test_pending_matches_requires_admin() -> None:
    response = client.get("/admin/matching/pending", headers=auth_headers("user-1", is_admin=False))
    assert response.status_code == 403


def test_pending_matches_requires_auth() -> None:
    response = client.get("/admin/matching/pending")
    assert response.status_code == 401


def test_pending_matches_lists_created_row(seeded_catalog: SeededCatalog) -> None:
    created_id, candidate_id, *_ = seeded_catalog.product_ids
    match_id = _create_pending_match(created_product_id=created_id, candidate_product_id=candidate_id)

    try:
        response = client.get("/admin/matching/pending", headers=auth_headers("admin-1", is_admin=True))
        assert response.status_code == 200
        body = response.json()
        assert any(item["id"] == match_id for item in body["results"])
    finally:
        _cleanup(match_id)


def test_reject_match_marks_resolved_without_reassigning(seeded_catalog: SeededCatalog) -> None:
    created_id, candidate_id, *_ = seeded_catalog.product_ids
    match_id = _create_pending_match(created_product_id=created_id, candidate_product_id=candidate_id)

    try:
        response = client.post(f"/admin/matching/{match_id}/reject", headers=auth_headers("admin-1", is_admin=True))
        assert response.status_code == 200
        assert response.json() == {"id": match_id, "status": "rejected"}

        again = client.post(f"/admin/matching/{match_id}/reject", headers=auth_headers("admin-1", is_admin=True))
        assert again.status_code == 409
    finally:
        _cleanup(match_id)


def test_approve_unknown_match_returns_404() -> None:
    response = client.post("/admin/matching/does-not-exist/approve", headers=auth_headers("admin-1", is_admin=True))
    assert response.status_code == 404


def test_merge_match_reassigns_offers_and_records_override(seeded_catalog: SeededCatalog) -> None:
    created_id, candidate_id, target_id = seeded_catalog.product_ids
    match_id = _create_pending_match(created_product_id=created_id, candidate_product_id=candidate_id)

    try:
        response = client.post(
            f"/admin/matching/{match_id}/merge",
            json={"target_product_id": target_id},
            headers=auth_headers("admin-1", is_admin=True),
        )
        assert response.status_code == 200
        assert response.json() == {"id": match_id, "status": "merged"}

        session = SessionLocal()
        try:
            override_count = session.execute(
                text("select count(*) from manual_overrides where vendor_slug = 'tunisianet' and external_id = 'ext-1'")
            ).scalar_one()
            assert override_count == 1
            # Meme vendeur des deux cotes : l'offre du doublon est fusionnee dans
            # l'offre existante de la cible (contrainte unique produit+vendeur).
            left_on_duplicate = session.execute(
                text("select count(*) from offers where product_id = :id"), {"id": created_id}
            ).scalar_one()
            assert left_on_duplicate == 0
            target_offer_ids = list(
                session.execute(text("select id from offers where product_id = :id"), {"id": target_id}).scalars()
            )
            assert target_offer_ids == [seeded_catalog.offer_ids[2]]
        finally:
            session.close()
    finally:
        _cleanup(match_id)


def test_admin_stats_requires_admin() -> None:
    response = client.get("/admin/stats", headers=auth_headers("user-1", is_admin=False))
    assert response.status_code == 403


def test_admin_stats_returns_structure() -> None:
    response = client.get("/admin/stats", headers=auth_headers("admin-1", is_admin=True))
    assert response.status_code == 200
    body = response.json()
    assert body["total_products"] >= 1
    assert body["total_offers"] >= 0
    assert "last_updated_at" in body
