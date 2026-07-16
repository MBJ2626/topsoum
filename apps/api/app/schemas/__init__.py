from __future__ import annotations

from app.schemas.admin import ScraperRunStatus, ScraperVendorStatus, ScrapersStatusResponse
from app.schemas.favorites import (
    FavoriteCreate,
    FavoriteListResponse,
    FavoriteOut,
    FavoriteTrackingUpdate,
)
from app.schemas.offers import OfferClickResponse
from app.schemas.products import (
    OfferSummary,
    PricePoint,
    ProductDetailResponse,
    ProductSearchResponse,
    ProductSearchResult,
)

__all__ = [
    "FavoriteCreate",
    "FavoriteListResponse",
    "FavoriteOut",
    "FavoriteTrackingUpdate",
    "OfferClickResponse",
    "OfferSummary",
    "PricePoint",
    "ProductDetailResponse",
    "ProductSearchResponse",
    "ProductSearchResult",
    "ScraperRunStatus",
    "ScraperVendorStatus",
    "ScrapersStatusResponse",
]
