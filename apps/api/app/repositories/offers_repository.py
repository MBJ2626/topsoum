from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, contains_eager

from app.repositories.models import Offer, Product, Vendor


def search_offers(
    session: Session,
    *,
    query: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Offer]:
    stmt = (
        select(Offer)
        .join(Offer.product)
        .join(Offer.vendor)
        .options(contains_eager(Offer.product), contains_eager(Offer.vendor))
        .order_by(Offer.price.asc())
    )

    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(or_(Product.model.ilike(pattern), Product.brand.ilike(pattern)))

    if category:
        stmt = stmt.where(Product.category == category)

    stmt = stmt.limit(limit).offset(offset)

    return list(session.execute(stmt).scalars())
