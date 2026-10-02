from __future__ import annotations

import datetime

from sqlalchemy.orm import Session

from app.repositories.models import ScanJob
from app.schemas.scans import (
    ScanCreateRequest,
    ScanJobOut,
    ScanListResponse,
    ScanScheduleOut,
    ScanScheduleUpdate,
    VendorScanResultOut,
)
from app.services import scans_service


def _iso_utc(value: datetime.datetime | None) -> str | None:
    """Colonnes Prisma en UTC naif : expose un ISO explicite en UTC."""
    return value.replace(tzinfo=datetime.UTC).isoformat() if value else None


def _to_job_out(job: ScanJob) -> ScanJobOut:
    # results est ecrit par le worker TypeScript (camelCase).
    results = [
        VendorScanResultOut(
            vendor=item.get("vendor", "?"),
            offers_collected=item.get("offersCollected"),
            scan_failures=item.get("scanFailures", 0),
            offers_loaded=item.get("offersLoaded"),
            error=item.get("error"),
        )
        for item in (job.results or [])
    ]
    return ScanJobOut(
        id=job.id,
        status=job.status,
        trigger=job.trigger,
        vendors=list(job.vendors or []),
        requested_at=_iso_utc(job.requested_at) or "",
        started_at=_iso_utc(job.started_at),
        finished_at=_iso_utc(job.finished_at),
        results=results,
        error=job.error,
    )


def list_scans_controller(session: Session) -> ScanListResponse:
    overview = scans_service.get_overview(session)
    return ScanListResponse(
        jobs=[_to_job_out(job) for job in overview.jobs],
        worker_online=overview.worker_online,
        worker_seen_at=_iso_utc(overview.worker_seen_at),
    )


def create_scan_controller(session: Session, payload: ScanCreateRequest) -> ScanJobOut:
    return _to_job_out(scans_service.request_scan(session, payload.vendors))


def _to_schedule_out(data: scans_service.ScheduleData) -> ScanScheduleOut:
    return ScanScheduleOut(
        enabled=data.enabled,
        times=data.times,
        timezone=str(scans_service.SCAN_TIMEZONE),
        next_run_at=_iso_utc(data.next_run_at),
    )


def get_schedule_controller(session: Session) -> ScanScheduleOut:
    return _to_schedule_out(scans_service.get_schedule(session))


def update_schedule_controller(session: Session, payload: ScanScheduleUpdate) -> ScanScheduleOut:
    return _to_schedule_out(scans_service.save_schedule(session, enabled=payload.enabled, times=payload.times))
