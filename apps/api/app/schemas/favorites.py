from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    """Seul le produit est fourni a la creation : price_tracking demarre
    toujours a False et ne peut etre change que via PATCH /tracking
    (suivi de prix MANUEL, jamais automatique)."""

    product_id: str


class FavoriteTrackingUpdate(BaseModel):
    price_tracking: bool


class FavoriteOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_image_url: str | None
    price_tracking: bool
    created_at: str
    best_offer_price: Decimal | None
    best_offer_vendor: str | None


class FavoriteListResponse(BaseModel):
    count: int
    results: list[FavoriteOut]
