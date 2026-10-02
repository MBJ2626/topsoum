from __future__ import annotations

import datetime
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.models import ScanJob, ScanSchedule

SCHEDULE_ID = "default"
ACTIVE_STATUSES = ("queued", "running")


def utcnow() -> datetime.datetime:
    """Horodatage UTC naif, comme les colonnes TIMESTAMP(3) ecrites par Prisma."""
    return datetime.datetime.now(datetime.UTC).replace(tzinfo=None)


def list_recent_jobs(session: Session, limit: int) -> list[ScanJob]:
    stmt = select(ScanJob).order_by(ScanJob.requested_at.desc()).limit(limit)
    return list(session.execute(stmt).scalars())


def has_active_job(session: Session) -> bool:
    stmt = select(ScanJob.id).where(ScanJob.status.in_(ACTIVE_STATUSES)).limit(1)
    return session.execute(stmt).first() is not None


def create_manual_job(session: Session, vendors: list[str]) -> ScanJob:
    job = ScanJob(
        id=str(uuid.uuid4()),
        status="queued",
        trigger="manual",
        vendors=vendors,
        requested_at=utcnow(),
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def get_schedule(session: Session) -> ScanSchedule | None:
    return session.get(ScanSchedule, SCHEDULE_ID)


def save_schedule(session: Session, *, enabled: bool, times: list[str]) -> ScanSchedule:
    schedule = get_schedule(session)
    if schedule is None:
        schedule = ScanSchedule(id=SCHEDULE_ID, worker_seen_at=None)
        session.add(schedule)
    schedule.enabled = enabled
    schedule.times = times
    schedule.configured_at = utcnow()
    session.commit()
    session.refresh(schedule)
    return schedule
