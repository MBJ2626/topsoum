from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.repositories.models import Favorite, Offer, Product

# Chaque fonction d'ecriture committe elle-meme : aucun endpoint actuel ne
# necessite plusieurs ecritures atomiques ensemble, donc pas d'unit-of-work
# explicite en V1.


def get_favorites_for_user(session: Session, user_id: str) -> list[Favorite]:
    stmt = (
        select(Favorite)
        .where(Favorite.user_id == user_id)
        .options(joinedload(Favorite.product).selectinload(Product.offers).joinedload(Offer.vendor))
    )
    return list(session.execute(stmt).unique().scalars())


def get_favorite(session: Session, user_id: str, product_id: str) -> Favorite | None:
    stmt = select(Favorite).where(Favorite.user_id == user_id, Favorite.product_id == product_id)
    return session.execute(stmt).scalar_one_or_none()


def get_favorite_by_id_and_user(session: Session, favorite_id: str, user_id: str) -> Favorite | None:
    """Le filtre user_id fait partie de la requete SQL : empeche un
    utilisateur d'agir sur le favori d'un autre en devinant un id."""
    stmt = (
        select(Favorite)
        .where(Favorite.id == favorite_id, Favorite.user_id == user_id)
        .options(joinedload(Favorite.product).selectinload(Product.offers).joinedload(Offer.vendor))
    )
    return session.execute(stmt).unique().scalar_one_or_none()


def create_favorite(session: Session, user_id: str, product_id: str) -> Favorite:
    # Prisma genere l'id via cuid() cote client au moment de l'insertion :
    # ce n'est pas un default cote DB, donc l'API doit fournir le sien.
    favorite = Favorite(id=str(uuid.uuid4()), user_id=user_id, product_id=product_id, price_tracking=False)
    session.add(favorite)
    session.commit()
    session.refresh(favorite)
    return favorite


def delete_favorite(session: Session, favorite: Favorite) -> None:
    session.delete(favorite)
    session.commit()


def set_price_tracking(session: Session, favorite: Favorite, price_tracking: bool) -> Favorite:
    favorite.price_tracking = price_tracking
    session.commit()
    session.refresh(favorite)
    return favorite
