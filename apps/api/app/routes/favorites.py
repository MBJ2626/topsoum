"""Endpoints uniquement, zero logique : delegue tout a favorites_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.controllers.favorites_controller import (
    create_favorite_controller,
    delete_favorite_controller,
    list_favorites_controller,
    update_tracking_controller,
)
from app.middlewares.auth import CurrentUser, get_current_user
from app.middlewares.rate_limit import limiter
from app.repositories.database import get_session
from app.schemas import FavoriteCreate, FavoriteListResponse, FavoriteOut, FavoriteTrackingUpdate

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=FavoriteListResponse)
def list_favorites(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> FavoriteListResponse:
    return list_favorites_controller(session, current_user)


@router.post("", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_favorite(
    request: Request,
    payload: FavoriteCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> FavoriteOut:
    return create_favorite_controller(session, current_user, payload)


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def delete_favorite(
    request: Request,
    favorite_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> None:
    delete_favorite_controller(session, current_user, favorite_id)


@router.patch("/{favorite_id}/tracking", response_model=FavoriteOut)
@limiter.limit("30/minute")
def update_tracking(
    request: Request,
    favorite_id: str,
    payload: FavoriteTrackingUpdate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Session = Depends(get_session),
) -> FavoriteOut:
    return update_tracking_controller(session, current_user, favorite_id, payload)
