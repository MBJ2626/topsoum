from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas import ScraperVendorStatus, ScrapersStatusResponse
from app.services.admin_service import get_scrapers_status


def get_scrapers_status_controller(session: Session) -> ScrapersStatusResponse:
    statuses = get_scrapers_status(session)

    vendors = [
        ScraperVendorStatus(
            vendor_name=item.vendor.name,
            last_run_started_at=item.run.started_at.isoformat() if item.run else None,
            last_run_finished_at=item.run.finished_at.isoformat() if item.run and item.run.finished_at else None,
            last_run_status=item.status,
            products_collected=item.run.products_collected if item.run else None,
            success_count=item.run.success_count if item.run else None,
            error_count=item.run.error_count if item.run else None,
            failure_rate=item.failure_rate,
        )
        for item in statuses
    ]
    return ScrapersStatusResponse(vendors=vendors)
