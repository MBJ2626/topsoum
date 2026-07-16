from __future__ import annotations

import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.repositories.models import PendingMatch


def list_pending(session: Session) -> list[PendingMatch]:
    stmt = (
        select(PendingMatch)
        .where(PendingMatch.status == "pending")
        .options(
            joinedload(PendingMatch.created_product),
            joinedload(PendingMatch.candidate_product),
        )
        .order_by(PendingMatch.created_at.asc())
    )
    return list(session.execute(stmt).unique().scalars())


def get_by_id(session: Session, match_id: str) -> PendingMatch | None:
    stmt = (
        select(PendingMatch)
        .where(PendingMatch.id == match_id)
        .options(
            joinedload(PendingMatch.created_product),
            joinedload(PendingMatch.candidate_product),
        )
    )
    return session.execute(stmt).unique().scalar_one_or_none()


def mark_resolved(
    session: Session, match: PendingMatch, *, status: str, resolved_product_id: str | None
) -> PendingMatch:
    match.status = status
    match.resolved_product_id = resolved_product_id
    match.resolved_at = datetime.datetime.now(datetime.timezone.utc)
    session.commit()
    session.refresh(match)
    return match
