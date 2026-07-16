from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.repositories.models import Offer


def get_offer_with_vendor(session: Session, offer_id: str) -> Offer | None:
    stmt = select(Offer).where(Offer.id == offer_id).options(joinedload(Offer.vendor))
    return session.execute(stmt).unique().scalar_one_or_none()
