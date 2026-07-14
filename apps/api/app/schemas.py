from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class OfferOut(BaseModel):
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


class ProductSearchResponse(BaseModel):
    count: int
    results: list[OfferOut]
