from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.errors import OfferNotFoundError
from app.repositories import offers_repository

logger = logging.getLogger("topsoum.offers")


@dataclass
class ClickResultData:
    redirect_url: str
    vendor_name: str


def record_offer_click(session: Session, offer_id: str) -> ClickResultData:
    offer = offers_repository.get_offer_with_vendor(session, offer_id)
    if offer is None:
        raise OfferNotFoundError(offer_id)

    # Pas de persistance d'un evenement de clic (pas de table ClickEvent
    # dans le schema actuel, non demandee) - seulement un log structure.
    # Gap connu pour la V2 si l'exploitation analytique du tracking
    # d'affiliation devient necessaire.
    logger.info(
        "offer_click",
        extra={"offer_id": offer.id, "product_id": offer.product_id, "vendor_id": offer.vendor_id},
    )

    return ClickResultData(redirect_url=offer.url, vendor_name=offer.vendor.name)
