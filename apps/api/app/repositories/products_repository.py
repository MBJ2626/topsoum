from __future__ import annotations

from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.repositories.models import Offer, PriceHistory, Product



def _escape_like(term: str) -> str:
    """Un "%" ou "_" tape par l'utilisateur doit etre cherche tel quel, pas servir de joker."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_products_candidates(
    session: Session,
    *,
    query: str | None = None,
    category: str | None = None,
    max_candidates: int = 500,
) -> list[Product]:
    """Ramene les produits candidats pour une recherche, avec leurs offres et
    vendeurs precharges. Ne pagine PAS ici : le tri "meilleur deal" est une
    regle metier qui vit dans services/, et la pagination doit s'appliquer
    apres ce tri pour etre correcte globalement (voir products_service.py).
    """
    stmt = (
        select(Product)
        .where(Product.offers.any())
        .options(selectinload(Product.offers).joinedload(Offer.vendor))
    )

    # Chaque mot doit apparaitre (dans le modele ou la marque), dans n'importe
    # quel ordre : "young 6 noir" doit trouver "Smartphone Lesia Young 6 2Go 16Go Noir".
    for term in (query or "").split():
        if term.isdigit():
            # Nombre entier en debut de mot : "6" trouve "Young 6" mais pas "16Go",
            # "128" trouve "128Go". Chiffres seuls : aucun echappement regex requis.
            pattern = rf"\m{term}(?![0-9])"
            stmt = stmt.where(or_(Product.model.op("~*")(pattern), Product.brand.op("~*")(pattern)))
            continue
        pattern = f"%{_escape_like(term)}%"
        stmt = stmt.where(
            or_(Product.model.ilike(pattern, escape="\\"), Product.brand.ilike(pattern, escape="\\"))
        )

    if category:
        stmt = stmt.where(Product.category == category)

    stmt = stmt.limit(max_candidates)

    return list(session.execute(stmt).unique().scalars())


def get_product_by_id(session: Session, product_id: str) -> Product | None:
    stmt = (
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.offers).joinedload(Offer.vendor))
    )
    return session.execute(stmt).unique().scalar_one_or_none()


def get_price_history_for_product(
    session: Session,
    product_id: str,
    *,
    since: datetime,
) -> list[PriceHistory]:
    stmt = (
        select(PriceHistory)
        .join(PriceHistory.offer)
        .where(Offer.product_id == product_id, PriceHistory.recorded_at >= since)
        .order_by(PriceHistory.recorded_at.asc())
    )
    return list(session.execute(stmt).scalars())


def product_exists(session: Session, product_id: str) -> bool:
    stmt = select(Product.id).where(Product.id == product_id)
    return session.execute(stmt).scalar_one_or_none() is not None
