from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.repositories.models import Offer, PriceHistory


def reassign_offers(session: Session, *, from_product_id: str, to_product_id: str) -> None:
    """Deplace les offres du produit duplique vers le produit cible.

    Ne supprime jamais le produit duplique (cf. plan Etape 7) : un produit
    sans offre disparait naturellement des resultats de recherche.
    Si le produit cible a deja une offre du meme vendeur (cas rare), fusionne
    l'historique de prix dans cette offre existante plutot que de violer la
    contrainte unique (product_id, vendor_id).
    """
    offers = list(session.execute(select(Offer).where(Offer.product_id == from_product_id)).scalars())

    for offer in offers:
        existing = session.execute(
            select(Offer).where(Offer.product_id == to_product_id, Offer.vendor_id == offer.vendor_id)
        ).scalar_one_or_none()

        if existing is None:
            offer.product_id = to_product_id
            continue

        session.execute(
            PriceHistory.__table__.update()
            .where(PriceHistory.offer_id == offer.id)
            .values(offer_id=existing.id)
        )
        session.delete(offer)

    session.commit()
