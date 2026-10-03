from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.errors import ProductNotFoundError
from app.repositories import product_events_repository, products_repository
from app.repositories.models import Offer, PriceHistory, Product
from app.services.scoring import best_deal, best_offer, deal_rank, has_reliable_price, rank_offers

PRICE_HISTORY_LOOKBACK_DAYS = 90

TOP_CATEGORY = "smartphones"
# "Les plus consultes" ne remplace le classement factuel qu'apres 7 jours de
# vues, et seulement si assez de produits ont ete vus.
TOP_VIEWS_PERIOD = timedelta(days=7)


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
    brand: str | None = None,
    ram_gb: int | None = None,
    max_price: Decimal | None = None,
    limit: int,
    offset: int,
) -> list[ProductSearchResultData]:
    # search_products_candidates ne pagine pas en SQL (jusqu'a 500 candidats) :
    # le tri par "meilleur deal" est une regle metier qui doit vivre ici, pas
    # en SQL dans repositories/, et la pagination doit s'appliquer APRES ce
    # tri pour etre correcte globalement. Au-dela de 500 produits candidats
    # pour une recherche donnee, le tri devient partiel - largement
    # suffisant pour le catalogue V1 (4 vendeurs, marche tunisien).
    products = products_repository.search_products_candidates(
        session, query=query, category=category, brand=brand, ram_gb=ram_gb
    )

    ranked = sorted(products, key=lambda product: deal_rank(product.offers))
    if max_price is not None:
        # Budget sur le meilleur deal FIABLE : un produit sans prix fiable n'est jamais "dans le budget".
        ranked = [
            product
            for product in ranked
            if has_reliable_price(deal := best_deal(product.offers)) and deal.price <= max_price
        ]
    page = ranked[offset : offset + limit]

    return [
        ProductSearchResultData(
            product=product,
            best_deal=best_deal(product.offers),
            offers_count=len(product.offers),
        )
        for product in page
    ]


@dataclass
class TopProductData:
    product: Product
    best_deal: Offer
    offers_count: int
    price_spread: Decimal | None
    views: int | None


@dataclass
class TopProductsData:
    mode: str  # "most_viewed" | "most_compared"
    period_days: int | None
    items: list[TopProductData]


def _priced_offers(product: Product) -> list[Offer]:
    return [offer for offer in product.offers if offer.price > 0]


def _top_item(product: Product, views: int | None) -> TopProductData | None:
    priced = _priced_offers(product)
    if not priced:
        return None
    prices = [offer.price for offer in priced]
    return TopProductData(
        product=product,
        best_deal=best_offer(priced),
        offers_count=len(priced),
        price_spread=(max(prices) - min(prices)) if len(priced) > 1 else None,
        views=views,
    )


def _most_viewed(session: Session, now: datetime, limit: int) -> list[TopProductData] | None:
    first_view = product_events_repository.first_event_at(session, "view")
    if first_view is None or now - first_view < TOP_VIEWS_PERIOD:
        return None
    counts = product_events_repository.count_by_product_since(
        session, event_type="view", since=now - TOP_VIEWS_PERIOD, limit=limit * 3
    )
    products = {
        product.id: product
        for product in products_repository.get_products_with_offers(session, [pid for pid, _ in counts])
    }
    items = [
        item
        for product_id, views in counts
        if product_id in products
        and products[product_id].category == TOP_CATEGORY
        and (item := _top_item(products[product_id], views)) is not None
    ][:limit]
    return items if len(items) >= limit else None


def _most_compared(session: Session, limit: int) -> list[TopProductData]:
    """Vendus chez le plus de revendeurs ; a egalite, le plus grand ecart de prix
    (la ou comparer fait le plus economiser). Au moins 2 revendeurs."""
    candidates = products_repository.search_products_candidates(session, category=TOP_CATEGORY, max_candidates=2000)
    items = [
        item for product in candidates if (item := _top_item(product, None)) is not None and item.offers_count >= 2
    ]
    items.sort(key=lambda item: (-item.offers_count, -(item.price_spread or 0), item.product.id))
    return items[:limit]


def get_top_products(session: Session, *, limit: int, now: datetime | None = None) -> TopProductsData:
    now = now or datetime.now(UTC).replace(tzinfo=None)
    viewed = _most_viewed(session, now, limit)
    if viewed is not None:
        return TopProductsData(mode="most_viewed", period_days=TOP_VIEWS_PERIOD.days, items=viewed)
    return TopProductsData(mode="most_compared", period_days=None, items=_most_compared(session, limit))


def record_product_view(session: Session, product_id: str) -> None:
    if not products_repository.product_exists(session, product_id):
        raise ProductNotFoundError(product_id)
    product_events_repository.add_event(
        session, product_id=product_id, event_type="view", at=datetime.now(UTC).replace(tzinfo=None)
    )


def get_product_detail(session: Session, product_id: str) -> ProductDetailData:
    product = products_repository.get_product_by_id(session, product_id)
    # Sans offre (ex : fiche fusionnee par l'admin), rien a comparer : introuvable.
    if product is None or not product.offers:
        raise ProductNotFoundError(product_id)

    since = datetime.now(UTC) - timedelta(days=PRICE_HISTORY_LOOKBACK_DAYS)
    history = products_repository.get_price_history_for_product(session, product_id, since=since)

    offers_sorted = rank_offers(product.offers)

    return ProductDetailData(
        product=product,
        best_deal=offers_sorted[0],
        offers=offers_sorted,
        price_history=history,
    )


@dataclass
class SitemapEntryData:
    product_id: str
    last_modified: datetime


def list_sitemap_entries(session: Session) -> list[SitemapEntryData]:
    return [
        SitemapEntryData(product_id=product_id, last_modified=last_modified)
        for product_id, last_modified in products_repository.list_sitemap_entries(session)
    ]
