"""Endpoints uniquement, zero logique : delegue tout a offers_controller."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.controllers.offers_controller import record_offer_click_controller
from app.middlewares.rate_limit import limiter
from app.repositories.database import get_session
from app.schemas import OfferClickResponse

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("/{offer_id}/click", response_model=OfferClickResponse)
@limiter.limit("20/minute")
def record_click(
    request: Request,
    offer_id: str,
    session: Session = Depends(get_session),
) -> OfferClickResponse:
    return record_offer_click_controller(session, offer_id)
