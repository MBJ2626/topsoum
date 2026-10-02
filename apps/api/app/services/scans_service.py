"""Scans a la demande et planification. L'API ne scrape jamais (docs/PROJET.md
4.2) : elle met un scan en file, le worker apps/etl-pipeline l'execute."""

from __future__ import annotations

import datetime
import re
from dataclasses import dataclass
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.errors import InvalidScanRequestError, ScanAlreadyActiveError
from app.repositories import scans_repository
from app.repositories.models import ScanJob

SCAN_TIMEZONE = ZoneInfo("Africa/Tunis")
MAX_DAILY_SLOTS = 6
RECENT_JOBS_LIMIT = 10
# Le worker bat toutes les 15 s : au-dela de 2 min sans signe de vie, il est arrete.
WORKER_STALE_AFTER = datetime.timedelta(minutes=2)

_TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
_VENDOR_PATTERN = re.compile(r"^[a-z0-9_-]+$")


@dataclass
class ScanOverview:
    jobs: list[ScanJob]
    worker_seen_at: datetime.datetime | None
    worker_online: bool


@dataclass
class ScheduleData:
    enabled: bool
    times: list[str]
    next_run_at: datetime.datetime | None


def get_overview(session: Session, *, now: datetime.datetime | None = None) -> ScanOverview:
    now = now or scans_repository.utcnow()
    schedule = scans_repository.get_schedule(session)
    seen = schedule.worker_seen_at if schedule else None
    return ScanOverview(
        jobs=scans_repository.list_recent_jobs(session, RECENT_JOBS_LIMIT),
        worker_seen_at=seen,
        worker_online=seen is not None and now - seen < WORKER_STALE_AFTER,
    )


def request_scan(session: Session, vendors: list[str]) -> ScanJob:
    cleaned = sorted({vendor.strip().lower() for vendor in vendors if vendor.strip()})
    if any(not _VENDOR_PATTERN.match(vendor) for vendor in cleaned):
        raise InvalidScanRequestError("Nom de vendeur invalide.")
    if scans_repository.has_active_job(session):
        raise ScanAlreadyActiveError()
    return scans_repository.create_manual_job(session, cleaned)


def next_run_at(times: list[str], now_utc: datetime.datetime) -> datetime.datetime | None:
    """Prochain creneau (UTC naif) parmi les heures de Tunis, aujourd'hui ou demain."""
    if not times:
        return None
    now_local = now_utc.replace(tzinfo=datetime.UTC).astimezone(SCAN_TIMEZONE)
    candidates = []
    for day_offset in (0, 1):
        day = now_local.date() + datetime.timedelta(days=day_offset)
        for value in times:
            hour, minute = (int(part) for part in value.split(":"))
            slot = datetime.datetime.combine(day, datetime.time(hour, minute), tzinfo=SCAN_TIMEZONE)
            if slot > now_local:
                candidates.append(slot)
    first = min(candidates)
    return first.astimezone(datetime.UTC).replace(tzinfo=None)


def get_schedule(session: Session, *, now: datetime.datetime | None = None) -> ScheduleData:
    schedule = scans_repository.get_schedule(session)
    enabled = schedule.enabled if schedule else False
    times = list(schedule.times) if schedule else []
    now = now or scans_repository.utcnow()
    return ScheduleData(enabled=enabled, times=times, next_run_at=next_run_at(times, now) if enabled else None)


def save_schedule(session: Session, *, enabled: bool, times: list[str]) -> ScheduleData:
    cleaned = sorted({value.strip() for value in times})
    if any(not _TIME_PATTERN.match(value) for value in cleaned):
        raise InvalidScanRequestError("Heure invalide : format attendu HH:MM.")
    if len(cleaned) > MAX_DAILY_SLOTS:
        raise InvalidScanRequestError(f"{MAX_DAILY_SLOTS} horaires maximum par jour.")
    if enabled and not cleaned:
        raise InvalidScanRequestError("Ajoutez au moins un horaire pour activer la planification.")
    scans_repository.save_schedule(session, enabled=enabled, times=cleaned)
    return get_schedule(session)
