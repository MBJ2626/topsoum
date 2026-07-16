from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.orm import Session

from app.errors import FavoriteAlreadyExistsError, FavoriteNotFoundError, ProductNotFoundError
from app.repositories import favorites_repository, products_repository
from app.repositories.models import Favorite
from app.services.scoring import best_offer


@dataclass
class FavoriteResultData:
    favorite: Favorite
    best_offer_price: Decimal | None
    best_offer_vendor: str | None


def to_result(favorite: Favorite) -> FavoriteResultData:
    offers = favorite.product.offers
    if not offers:
        return FavoriteResultData(favorite=favorite, best_offer_price=None, best_offer_vendor=None)
    offer = best_offer(offers)
    return FavoriteResultData(favorite=favorite, best_offer_price=offer.price, best_offer_vendor=offer.vendor.name)


def list_favorites(session: Session, user_id: str) -> list[FavoriteResultData]:
    favorites = favorites_repository.get_favorites_for_user(session, user_id)
    return [to_result(favorite) for favorite in favorites]


def add_favorite(session: Session, user_id: str, product_id: str) -> Favorite:
    if not products_repository.product_exists(session, product_id):
        raise ProductNotFoundError(product_id)
    if favorites_repository.get_favorite(session, user_id, product_id) is not None:
        raise FavoriteAlreadyExistsError(product_id)
    return favorites_repository.create_favorite(session, user_id, product_id)


def remove_favorite(session: Session, user_id: str, favorite_id: str) -> None:
    favorite = favorites_repository.get_favorite_by_id_and_user(session, favorite_id, user_id)
    if favorite is None:
        # Meme erreur qu'il n'existe pas ou qu'il appartienne a un autre
        # utilisateur : ne jamais reveler l'existence du favori d'autrui.
        raise FavoriteNotFoundError(favorite_id)
    favorites_repository.delete_favorite(session, favorite)


def update_tracking(session: Session, user_id: str, favorite_id: str, price_tracking: bool) -> Favorite:
    """Seul point d'entree de tout le code qui modifie price_tracking :
    suivi de prix MANUEL par produit, jamais automatique (regle immuable)."""
    favorite = favorites_repository.get_favorite_by_id_and_user(session, favorite_id, user_id)
    if favorite is None:
        raise FavoriteNotFoundError(favorite_id)
    return favorites_repository.set_price_tracking(session, favorite, price_tracking)
