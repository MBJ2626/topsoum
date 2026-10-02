"""Endpoints uniquement, zero logique : delegue tout a scans_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.scans_controller import (
    create_scan_controller,
    get_schedule_controller,
    list_scans_controller,
    update_schedule_controller,
)
from app.middlewares.auth import CurrentUser, require_admin
from app.repositories.database import get_session
from app.schemas.scans import ScanCreateRequest, ScanJobOut, ScanListResponse, ScanScheduleOut, ScanScheduleUpdate

router = APIRouter(prefix="/admin/scans", tags=["admin"])


@router.get("", response_model=ScanListResponse)
def list_scans(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> ScanListResponse:
    return list_scans_controller(session)


@router.post("", response_model=ScanJobOut, status_code=status.HTTP_201_CREATED)
def create_scan(
    payload: ScanCreateRequest,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> ScanJobOut:
    return create_scan_controller(session, payload)


@router.get("/schedule", response_model=ScanScheduleOut)
def get_schedule(
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> ScanScheduleOut:
    return get_schedule_controller(session)


@router.put("/schedule", response_model=ScanScheduleOut)
def update_schedule(
    payload: ScanScheduleUpdate,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    session: Session = Depends(get_session),
) -> ScanScheduleOut:
    return update_schedule_controller(session, payload)
