from __future__ import annotations

import datetime
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.repositories.models import ProductEvent


def add_event(session: Session, *, product_id: str, event_type: str, at: datetime.datetime) -> None:
    session.add(ProductEvent(id=str(uuid.uuid4()), product_id=product_id, type=event_type, created_at=at))
    session.commit()


def first_event_at(session: Session, event_type: str) -> datetime.datetime | None:
    return session.execute(select(func.min(ProductEvent.created_at)).where(ProductEvent.type == event_type)).scalar()


def count_by_product_since(
    session: Session, *, event_type: str, since: datetime.datetime, limit: int
) -> list[tuple[str, int]]:
    """(product_id, nombre d'evenements) depuis `since`, du plus au moins frequent."""
    count = func.count(ProductEvent.id)
    stmt = (
        select(ProductEvent.product_id, count)
        .where(ProductEvent.type == event_type, ProductEvent.created_at >= since)
        .group_by(ProductEvent.product_id)
        .order_by(count.desc(), ProductEvent.product_id)
        .limit(limit)
    )
    return [(product_id, total) for product_id, total in session.execute(stmt).all()]
