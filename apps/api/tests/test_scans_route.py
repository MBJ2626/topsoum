from __future__ import annotations

import datetime
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.main import app
from app.repositories import scans_repository
from app.repositories.database import SessionLocal
from app.repositories.models import ScanJob
from app.services.scans_service import next_run_at
from tests.conftest import auth_headers

client = TestClient(app)
ADMIN = auth_headers("admin-1", is_admin=True)


@pytest.fixture
def restore_schedule() -> Iterator[None]:
    """La planification est une ligne unique de la DB de dev : remise en l'etat apres le test."""
    session = SessionLocal()
    original = scans_repository.get_schedule(session)
    # Pas de ligne avant le test = planification desactivee.
    saved = (original.enabled, list(original.times)) if original else (False, [])
    session.close()
    yield
    session = SessionLocal()
    scans_repository.save_schedule(session, enabled=saved[0], times=saved[1])
    session.close()


def test_scans_require_admin() -> None:
    assert client.get("/admin/scans").status_code == 401
    assert client.get("/admin/scans", headers=auth_headers("user-1")).status_code == 403
    assert client.post("/admin/scans", json={}, headers=auth_headers("user-1")).status_code == 403
    assert client.put("/admin/scans/schedule", json={"enabled": False}, headers=auth_headers("user-1")).status_code == 403


def test_list_scans_structure() -> None:
    response = client.get("/admin/scans", headers=ADMIN)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"jobs", "worker_online", "worker_seen_at"}


def test_create_scan_queues_then_rejects_a_second_one() -> None:
    session = SessionLocal()
    if scans_repository.has_active_job(session):
        session.close()
        pytest.skip("Un scan reel est deja actif dans la DB de dev")

    created_id = None
    try:
        first = client.post("/admin/scans", json={"vendors": ["Tunisianet"]}, headers=ADMIN)
        assert first.status_code == 201
        created_id = first.json()["id"]
        assert first.json()["status"] == "queued"
        assert first.json()["trigger"] == "manual"
        assert first.json()["vendors"] == ["tunisianet"]

        second = client.post("/admin/scans", json={}, headers=ADMIN)
        assert second.status_code == 409
    finally:
        if created_id:
            session.execute(delete(ScanJob).where(ScanJob.id == created_id))
            session.commit()
        session.close()


def test_create_scan_rejects_invalid_vendor() -> None:
    response = client.post("/admin/scans", json={"vendors": ["../etc"]}, headers=ADMIN)
    assert response.status_code == 422


def test_schedule_round_trip(restore_schedule: None) -> None:
    response = client.put("/admin/scans/schedule", json={"enabled": True, "times": ["19:00", "08:00", "08:00"]}, headers=ADMIN)
    assert response.status_code == 200
    body = response.json()
    assert body["enabled"] is True
    assert body["times"] == ["08:00", "19:00"]
    assert body["timezone"] == "Africa/Tunis"
    assert body["next_run_at"] is not None

    assert client.get("/admin/scans/schedule", headers=ADMIN).json()["times"] == ["08:00", "19:00"]


@pytest.mark.parametrize(
    "payload",
    [
        {"enabled": True, "times": ["25:00"]},
        {"enabled": True, "times": []},
        {"enabled": True, "times": ["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00"]},
    ],
)
def test_schedule_validation(payload: dict, restore_schedule: None) -> None:
    assert client.put("/admin/scans/schedule", json=payload, headers=ADMIN).status_code == 422


def test_next_run_at_uses_tunis_time() -> None:
    now = datetime.datetime(2026, 10, 2, 7, 10)  # 08:10 a Tunis (UTC+1)
    assert next_run_at(["08:00", "13:00"], now) == datetime.datetime(2026, 10, 2, 12, 0)
    assert next_run_at(["08:00"], now) == datetime.datetime(2026, 10, 3, 7, 0)
    assert next_run_at([], now) is None
