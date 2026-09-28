from __future__ import annotations

from app.schemas.admin import AdminStatsResponse, ScraperRunStatus, ScraperVendorStatus, ScrapersStatusResponse
from app.schemas.favorites import (
    FavoriteCreate,
    FavoriteListResponse,
    FavoriteOut,
    FavoriteTrackingUpdate,
)
from app.schemas.matching import (
    MatchActionResponse,
    MergeMatchRequest,
    PendingMatchListResponse,
    PendingMatchOut,
    PendingMatchProductSummary,
)
from app.schemas.offers import OfferClickResponse
from app.schemas.products import (
    OfferSummary,
    PricePoint,
    ProductDetailResponse,
    ProductSearchResponse,
    ProductSearchResult,
    ProductSitemapEntry,
    ProductSitemapResponse,
)

__all__ = [
    "AdminStatsResponse",
    "FavoriteCreate",
    "FavoriteListResponse",
    "FavoriteOut",
    "FavoriteTrackingUpdate",
    "MatchActionResponse",
    "MergeMatchRequest",
    "OfferClickResponse",
    "OfferSummary",
    "PendingMatchListResponse",
    "PendingMatchOut",
    "PendingMatchProductSummary",
    "PricePoint",
    "ProductDetailResponse",
    "ProductSearchResponse",
    "ProductSearchResult",
    "ProductSitemapEntry",
    "ProductSitemapResponse",
    "ScraperRunStatus",
    "ScraperVendorStatus",
    "ScrapersStatusResponse",
]
