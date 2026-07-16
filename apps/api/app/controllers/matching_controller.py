from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.models import PendingMatch, Product
from app.schemas import (
    MatchActionResponse,
    MergeMatchRequest,
    PendingMatchListResponse,
    PendingMatchOut,
    PendingMatchProductSummary,
)
from app.services import matching_service


def _product_summary(product: Product) -> PendingMatchProductSummary:
    return PendingMatchProductSummary(
        id=product.id,
        canonical_name=product.canonical_name,
        brand=product.brand,
        model=product.model,
        image_url=product.image_url,
    )


def _pending_match_out(match: PendingMatch) -> PendingMatchOut:
    return PendingMatchOut(
        id=match.id,
        vendor_slug=match.vendor_slug,
        external_id=match.external_id,
        reference=match.reference,
        offer_product_name=match.offer_product_name,
        category=match.category,
        confidence=match.confidence,
        strategy=match.strategy,
        created_at=match.created_at.isoformat(),
        created_product=_product_summary(match.created_product),
        candidate_product=_product_summary(match.candidate_product),
    )


def list_pending_matches_controller(session: Session) -> PendingMatchListResponse:
    matches = matching_service.list_pending_matches(session)
    results = [_pending_match_out(match) for match in matches]
    return PendingMatchListResponse(count=len(results), results=results)


def approve_match_controller(session: Session, match_id: str) -> MatchActionResponse:
    match = matching_service.approve_match(session, match_id)
    return MatchActionResponse(id=match.id, status=match.status)


def reject_match_controller(session: Session, match_id: str) -> MatchActionResponse:
    match = matching_service.reject_match(session, match_id)
    return MatchActionResponse(id=match.id, status=match.status)


def merge_match_controller(session: Session, match_id: str, payload: MergeMatchRequest) -> MatchActionResponse:
    match = matching_service.merge_match(session, match_id, payload.target_product_id)
    return MatchActionResponse(id=match.id, status=match.status)
