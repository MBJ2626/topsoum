from __future__ import annotations

import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.repositories.models import Offer, Product


def count_products(session: Session) -> int:
    return session.execute(select(func.count()).select_from(Product)).scalar_one()


def count_offers(session: Session) -> int:
    return session.execute(select(func.count()).select_from(Offer)).scalar_one()


def last_updated_at(session: Session) -> datetime.datetime | None:
    last_product_update = session.execute(select(func.max(Product.updated_at))).scalar_one()
    last_offer_scrape = session.execute(select(func.max(Offer.scraped_at))).scalar_one()

    candidates = [value for value in (last_product_update, last_offer_scrape) if value is not None]
    return max(candidates) if candidates else None
