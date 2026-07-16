from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.errors import ProductNotFoundError
from app.repositories import products_repository
from app.repositories.models import Offer, PriceHistory, Product
from app.services.scoring import best_offer, score_offer

PRICE_HISTORY_LOOKBACK_DAYS = 90


@dataclass
class ProductSearchResultData:
    product: Product
    best_deal: Offer
    offers_count: int


@dataclass
class ProductDetailData:
    product: Product
    best_deal: Offer
    offers: list[Offer]
    price_history: list[PriceHistory]


def search_products(
    session: Session,
    *,
    query: str | None,
    category: str | None,
    limit: int,
    offset: int,
) -> list[ProductSearchResultData]:
    # search_products_candidates ne pagine pas en SQL (jusqu'a 500 candidats) :
    # le tri par "meilleur deal" est une regle metier qui doit vivre ici, pas
    # en SQL dans repositories/, et la pagination doit s'appliquer APRES ce
    # tri pour etre correcte globalement. Au-dela de 500 produits candidats
    # pour une recherche donnee, le tri devient partiel - largement
    # suffisant pour le catalogue V1 (4 vendeurs, marche tunisien).
    products = products_repository.search_products_candidates(session, query=query, category=category)

    ranked = sorted(products, key=lambda product: score_offer(best_offer(product.offers)))
    page = ranked[offset : offset + limit]

    return [
        ProductSearchResultData(
            product=product,
            best_deal=best_offer(product.offers),
            offers_count=len(product.offers),
        )
        for product in page
    ]


def get_product_detail(session: Session, product_id: str) -> ProductDetailData:
    product = products_repository.get_product_by_id(session, product_id)
    if product is None:
        raise ProductNotFoundError(product_id)

    since = datetime.now(UTC) - timedelta(days=PRICE_HISTORY_LOOKBACK_DAYS)
    history = products_repository.get_price_history_for_product(session, product_id, since=since)

    offers_sorted = sorted(product.offers, key=score_offer)

    return ProductDetailData(
        product=product,
        best_deal=offers_sorted[0],
        offers=offers_sorted,
        price_history=history,
    )
