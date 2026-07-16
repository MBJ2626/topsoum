from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class OfferSummary(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    price: Decimal
    currency: str
    stock_status: str
    url: str
    shipping_cost: Decimal | None
    scraped_at: str


class ProductSearchResult(BaseModel):
    id: str
    canonical_name: str
    brand: str
    model: str
    category: str
    image_url: str | None
    best_deal: OfferSummary
    offers_count: int


class ProductSearchResponse(BaseModel):
    count: int
    results: list[ProductSearchResult]


class PricePoint(BaseModel):
    offer_id: str
    price: Decimal
    recorded_at: str


class ProductDetailResponse(BaseModel):
    id: str
    canonical_name: str
    brand: str
    model: str
    category: str
    specs: dict
    image_url: str | None
    best_deal: OfferSummary
    offers: list[OfferSummary]
    price_history: list[PricePoint]
