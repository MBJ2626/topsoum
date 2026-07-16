"""Endpoints uniquement, zero logique : delegue tout a admin_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.admin_controller import get_admin_stats_controller, get_scrapers_status_controller
from app.middlewares.auth import CurrentUser, require_admin
from app.repositories.database import get_session
from app.schemas import AdminStatsResponse, ScrapersStatusResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/scrapers/status", response_model=ScrapersStatusResponse)
def get_scrapers_status(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> ScrapersStatusResponse:
    return get_scrapers_status_controller(session)


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> AdminStatsResponse:
    return get_admin_stats_controller(session)
