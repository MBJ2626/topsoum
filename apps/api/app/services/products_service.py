from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.offers_repository import search_offers


@dataclass
class OfferResult:
    id: str
    product_id: str
    product_name: str
    brand: str
    category: str
    vendor_name: str
    price: Decimal
    currency: str
    stock_status: str
    url: str
    image_url: str | None
    shipping_cost: Decimal | None
    scraped_at: str


def search_products(
    session: Session,
    *,
    query: str | None,
    category: str | None,
    limit: int,
    offset: int,
) -> list[OfferResult]:
    offers = search_offers(session, query=query, category=category, limit=limit, offset=offset)

    return [
        OfferResult(
            id=offer.id,
            product_id=offer.product_id,
            product_name=offer.product.model,
            brand=offer.product.brand,
            category=offer.product.category,
            vendor_name=offer.vendor.name,
            price=offer.price,
            currency="TND",
            stock_status=offer.stock_status,
            url=offer.url,
            image_url=offer.product.image_url,
            shipping_cost=offer.shipping_cost,
            scraped_at=offer.scraped_at.isoformat(),
        )
        for offer in offers
    ]
