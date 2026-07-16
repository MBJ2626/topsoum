from __future__ import annotations

import datetime
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.repositories import scraper_runs_repository, stats_repository
from app.repositories.models import ScraperRun, Vendor


@dataclass
class VendorStatusData:
    vendor: Vendor
    run: ScraperRun | None
    status: str | None
    failure_rate: float | None


@dataclass
class AdminStatsData:
    total_products: int
    total_offers: int
    last_updated_at: datetime.datetime | None


def get_admin_stats(session: Session) -> AdminStatsData:
    return AdminStatsData(
        total_products=stats_repository.count_products(session),
        total_offers=stats_repository.count_offers(session),
        last_updated_at=stats_repository.last_updated_at(session),
    )


def get_scrapers_status(session: Session) -> list[VendorStatusData]:
    vendors = scraper_runs_repository.get_all_vendors(session)
    latest_by_vendor = scraper_runs_repository.get_latest_run_per_vendor(session)

    results: list[VendorStatusData] = []
    for vendor in vendors:
        run = latest_by_vendor.get(vendor.id)
        if run is None:
            results.append(VendorStatusData(vendor=vendor, run=None, status=None, failure_rate=None))
            continue

        total = run.success_count + run.error_count
        failure_rate = (run.error_count / total) if total > 0 else None

        if run.finished_at is None:
            status = "running"
        elif run.error_count == 0:
            status = "success"
        elif run.success_count == 0:
            status = "failed"
        else:
            status = "partial"

        results.append(VendorStatusData(vendor=vendor, run=run, status=status, failure_rate=failure_rate))

    return results
