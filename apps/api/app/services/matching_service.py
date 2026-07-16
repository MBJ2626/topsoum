from __future__ import annotations

from sqlalchemy.orm import Session

from app.errors import PendingMatchAlreadyResolvedError, PendingMatchNotFoundError
from app.repositories import manual_overrides_repository, matching_repository, pending_matches_repository
from app.repositories.models import PendingMatch


def list_pending_matches(session: Session) -> list[PendingMatch]:
    return pending_matches_repository.list_pending(session)


def _get_pending_or_raise(session: Session, match_id: str) -> PendingMatch:
    match = pending_matches_repository.get_by_id(session, match_id)
    if match is None:
        raise PendingMatchNotFoundError(match_id)
    if match.status != "pending":
        raise PendingMatchAlreadyResolvedError(match_id)
    return match


def _resolve_with_merge(session: Session, match: PendingMatch, *, target_product_id: str, status: str) -> PendingMatch:
    matching_repository.reassign_offers(
        session, from_product_id=match.created_product_id, to_product_id=target_product_id
    )
    manual_overrides_repository.create(
        session,
        vendor_slug=match.vendor_slug,
        external_id=match.external_id,
        reference=match.reference,
        product_id=target_product_id,
    )
    return pending_matches_repository.mark_resolved(
        session, match, status=status, resolved_product_id=target_product_id
    )


def approve_match(session: Session, match_id: str) -> PendingMatch:
    """Confirme la suggestion du moteur : fusionne vers le candidat propose."""
    match = _get_pending_or_raise(session, match_id)
    return _resolve_with_merge(session, match, target_product_id=match.candidate_product_id, status="approved")


def reject_match(session: Session, match_id: str) -> PendingMatch:
    """La suggestion est fausse : le produit cree par l'ETL reste independant."""
    match = _get_pending_or_raise(session, match_id)
    return pending_matches_repository.mark_resolved(session, match, status="rejected", resolved_product_id=None)


def merge_match(session: Session, match_id: str, target_product_id: str) -> PendingMatch:
    """L'admin choisit manuellement un autre produit cible que le candidat suggere."""
    match = _get_pending_or_raise(session, match_id)
    return _resolve_with_merge(session, match, target_product_id=target_product_id, status="merged")
