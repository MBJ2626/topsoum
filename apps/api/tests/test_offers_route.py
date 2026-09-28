from __future__ import annotations

from app.main import app
from tests.conftest import SeededCatalog

from fastapi.testclient import TestClient

client = TestClient(app)


def test_record_click_returns_redirect_url(seeded_catalog: SeededCatalog) -> None:
    offer_id = seeded_catalog.offer_ids[0]
    response = client.post(f"/offers/{offer_id}/click")
    assert response.status_code == 200

    body = response.json()
    assert body["redirect_url"]
    assert body["vendor_name"]


def test_record_click_returns_404_for_unknown_offer() -> None:
    response = client.post("/offers/does-not-exist-xyz/click")
    assert response.status_code == 404
