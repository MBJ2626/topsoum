from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

MatchActionStatus = Literal["approved", "rejected", "merged"]


class PendingMatchProductSummary(BaseModel):
    id: str
    canonical_name: str
    brand: str
    model: str
    image_url: str | None


class PendingMatchOut(BaseModel):
    id: str
    vendor_slug: str
    external_id: str | None
    reference: str | None
    offer_product_name: str
    category: str
    confidence: float
    strategy: str
    created_at: str
    created_product: PendingMatchProductSummary
    candidate_product: PendingMatchProductSummary


class PendingMatchListResponse(BaseModel):
    count: int
    results: list[PendingMatchOut]


class MatchActionResponse(BaseModel):
    id: str
    status: MatchActionStatus


class MergeMatchRequest(BaseModel):
    target_product_id: str
