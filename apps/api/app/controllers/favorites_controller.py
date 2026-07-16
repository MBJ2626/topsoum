from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.middlewares.auth import CurrentUser
from app.repositories.models import Favorite
from app.schemas import FavoriteCreate, FavoriteListResponse, FavoriteOut, FavoriteTrackingUpdate
from app.services import favorites_service
from app.services.favorites_service import FavoriteResultData


def _favorite_out(favorite: Favorite, *, best_offer_price: Decimal | None, best_offer_vendor: str | None) -> FavoriteOut:
    return FavoriteOut(
        id=favorite.id,
        product_id=favorite.product_id,
        product_name=favorite.product.model,
        product_image_url=favorite.product.image_url,
        price_tracking=favorite.price_tracking,
        created_at=favorite.created_at.isoformat(),
        best_offer_price=best_offer_price,
        best_offer_vendor=best_offer_vendor,
    )


def _from_result(result: FavoriteResultData) -> FavoriteOut:
    return _favorite_out(
        result.favorite,
        best_offer_price=result.best_offer_price,
        best_offer_vendor=result.best_offer_vendor,
    )


def list_favorites_controller(session: Session, current_user: CurrentUser) -> FavoriteListResponse:
    results = favorites_service.list_favorites(session, current_user.id)
    out = [_from_result(result) for result in results]
    return FavoriteListResponse(count=len(out), results=out)


def create_favorite_controller(session: Session, current_user: CurrentUser, payload: FavoriteCreate) -> FavoriteOut:
    favorite = favorites_service.add_favorite(session, current_user.id, payload.product_id)
    return _from_result(favorites_service.to_result(favorite))


def delete_favorite_controller(session: Session, current_user: CurrentUser, favorite_id: str) -> None:
    favorites_service.remove_favorite(session, current_user.id, favorite_id)


def update_tracking_controller(
    session: Session,
    current_user: CurrentUser,
    favorite_id: str,
    payload: FavoriteTrackingUpdate,
) -> FavoriteOut:
    favorite = favorites_service.update_tracking(session, current_user.id, favorite_id, payload.price_tracking)
    return _from_result(favorites_service.to_result(favorite))
