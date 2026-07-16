from __future__ import annotations

from sqlalchemy import text

from app.main import app
from app.repositories.database import SessionLocal

from fastapi.testclient import TestClient

client = TestClient(app)


def _existing_offer_id() -> str:
    session = SessionLocal()
    try:
        return session.execute(text("select id from offers limit 1")).scalar_one()
    finally:
        session.close()


def test_record_click_returns_redirect_url() -> None:
    offer_id = _existing_offer_id()
    response = client.post(f"/offers/{offer_id}/click")
    assert response.status_code == 200

    body = response.json()
    assert body["redirect_url"]
    assert body["vendor_name"]


def test_record_click_returns_404_for_unknown_offer() -> None:
    response = client.post("/offers/does-not-exist-xyz/click")
    assert response.status_code == 404
