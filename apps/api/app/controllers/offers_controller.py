from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas import OfferClickResponse
from app.services.offers_service import record_offer_click


def record_offer_click_controller(session: Session, offer_id: str) -> OfferClickResponse:
    result = record_offer_click(session, offer_id)
    return OfferClickResponse(redirect_url=result.redirect_url, vendor_name=result.vendor_name)
