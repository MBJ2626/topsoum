from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.models import ScraperRun, Vendor


def get_all_vendors(session: Session) -> list[Vendor]:
    return list(session.execute(select(Vendor)).scalars())


def get_latest_run_per_vendor(session: Session) -> dict[str, ScraperRun]:
    """SELECT DISTINCT ON (vendor_id) ... ORDER BY vendor_id, started_at DESC.
    Acceptable car la stack DB est Postgres-only (cf. repositories/database.py).
    """
    stmt = (
        select(ScraperRun)
        .distinct(ScraperRun.vendor_id)
        .order_by(ScraperRun.vendor_id, ScraperRun.started_at.desc())
    )
    runs = session.execute(stmt).scalars()
    return {run.vendor_id: run for run in runs}
