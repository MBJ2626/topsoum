from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import auth_headers

client = TestClient(app)


def test_scrapers_status_requires_admin() -> None:
    response = client.get("/admin/scrapers/status", headers=auth_headers("user-1", is_admin=False))
    assert response.status_code == 403


def test_scrapers_status_requires_auth() -> None:
    response = client.get("/admin/scrapers/status")
    assert response.status_code == 401


def test_scrapers_status_returns_structure_for_admin() -> None:
    response = client.get("/admin/scrapers/status", headers=auth_headers("admin-1", is_admin=True))
    assert response.status_code == 200

    body = response.json()
    assert "vendors" in body
    for vendor in body["vendors"]:
        assert "vendor_name" in vendor
        assert "last_run_status" in vendor
        assert "failure_rate" in vendor
