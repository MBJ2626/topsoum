from __future__ import annotations

import datetime

from sqlalchemy.orm import Session

from app.schemas import AdminStatsResponse, ScraperVendorStatus, ScrapersStatusResponse
from app.services.admin_service import get_admin_stats, get_scrapers_status


def _iso_utc(value: datetime.datetime | None) -> str | None:
    """Colonnes Prisma en UTC naif : sans le fuseau, le navigateur les lirait en heure locale."""
    if value is None:
        return None
    return (value if value.tzinfo else value.replace(tzinfo=datetime.UTC)).isoformat()


def get_scrapers_status_controller(session: Session) -> ScrapersStatusResponse:
    statuses = get_scrapers_status(session)

    vendors = [
        ScraperVendorStatus(
            vendor_name=item.vendor.name,
            last_run_started_at=_iso_utc(item.run.started_at) if item.run else None,
            last_run_finished_at=_iso_utc(item.run.finished_at) if item.run else None,
            last_run_status=item.status,
            products_collected=item.run.products_collected if item.run else None,
            success_count=item.run.success_count if item.run else None,
            error_count=item.run.error_count if item.run else None,
            failure_rate=item.failure_rate,
        )
        for item in statuses
    ]
    return ScrapersStatusResponse(vendors=vendors)


def get_admin_stats_controller(session: Session) -> AdminStatsResponse:
    stats = get_admin_stats(session)
    return AdminStatsResponse(
        total_products=stats.total_products,
        total_offers=stats.total_offers,
        last_updated_at=_iso_utc(stats.last_updated_at),
    )
