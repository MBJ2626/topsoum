"""Integration contre la DB de dev. Utilise un utilisateur et un produit
deja en base (seedes par le pipeline ETL) plutot que d'en creer, pour rester
coherent avec la convention d'integration de test_products_route.py.
"""

from __future__ import annotations

from sqlalchemy import text

from app.main import app
from app.repositories.database import SessionLocal
from tests.conftest import auth_headers

from fastapi.testclient import TestClient

client = TestClient(app)


def _existing_user_id() -> str:
    session = SessionLocal()
    try:
        return session.execute(text("select id from users limit 1")).scalar_one()
    finally:
        session.close()


def _existing_product_id() -> str:
    session = SessionLocal()
    try:
        return session.execute(text("select id from products limit 1")).scalar_one()
    finally:
        session.close()


def _cleanup_favorite(user_id: str, product_id: str) -> None:
    session = SessionLocal()
    try:
        session.execute(
            text("delete from favorites where user_id = :user_id and product_id = :product_id"),
            {"user_id": user_id, "product_id": product_id},
        )
        session.commit()
    finally:
        session.close()


def test_list_favorites_requires_auth() -> None:
    response = client.get("/favorites")
    assert response.status_code == 401


def test_favorite_lifecycle() -> None:
    user_id = _existing_user_id()
    product_id = _existing_product_id()
    _cleanup_favorite(user_id, product_id)
    headers = auth_headers(user_id)

    try:
        create_response = client.post("/favorites", json={"product_id": product_id}, headers=headers)
        assert create_response.status_code == 201
        favorite = create_response.json()
        assert favorite["product_id"] == product_id
        assert favorite["price_tracking"] is False

        duplicate_response = client.post("/favorites", json={"product_id": product_id}, headers=headers)
        assert duplicate_response.status_code == 409

        list_response = client.get("/favorites", headers=headers)
        assert list_response.status_code == 200
        assert any(item["id"] == favorite["id"] for item in list_response.json()["results"])

        toggle_response = client.patch(
            f"/favorites/{favorite['id']}/tracking",
            json={"price_tracking": True},
            headers=headers,
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["price_tracking"] is True

        delete_response = client.delete(f"/favorites/{favorite['id']}", headers=headers)
        assert delete_response.status_code == 204
    finally:
        _cleanup_favorite(user_id, product_id)


def test_delete_favorite_of_another_user_returns_404_not_403() -> None:
    """Ne doit jamais reveler l'existence du favori d'autrui : meme 404
    qu'un id totalement inconnu."""
    other_user_headers = auth_headers("some-other-user-id")

    response = client.delete("/favorites/does-not-matter", headers=other_user_headers)
    assert response.status_code == 404


def test_add_favorite_for_unknown_product_returns_404() -> None:
    user_id = _existing_user_id()
    headers = auth_headers(user_id)

    response = client.post("/favorites", json={"product_id": "does-not-exist-xyz"}, headers=headers)
    assert response.status_code == 404
