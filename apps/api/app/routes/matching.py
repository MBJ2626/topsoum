"""Endpoints uniquement, zero logique : delegue tout a matching_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.matching_controller import (
    approve_match_controller,
    list_pending_matches_controller,
    merge_match_controller,
    reject_match_controller,
)
from app.middlewares.auth import CurrentUser, require_admin
from app.repositories.database import get_session
from app.schemas import MatchActionResponse, MergeMatchRequest, PendingMatchListResponse

router = APIRouter(prefix="/admin/matching", tags=["admin"])


@router.get("/pending", response_model=PendingMatchListResponse)
def list_pending_matches(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> PendingMatchListResponse:
    return list_pending_matches_controller(session)


@router.post("/{match_id}/approve", response_model=MatchActionResponse)
def approve_match(
    match_id: str,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> MatchActionResponse:
    return approve_match_controller(session, match_id)


@router.post("/{match_id}/reject", response_model=MatchActionResponse)
def reject_match(
    match_id: str,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> MatchActionResponse:
    return reject_match_controller(session, match_id)


@router.post("/{match_id}/merge", response_model=MatchActionResponse)
def merge_match(
    match_id: str,
    payload: MergeMatchRequest,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> MatchActionResponse:
    return merge_match_controller(session, match_id, payload)
