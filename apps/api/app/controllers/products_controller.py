from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.models import Offer
from app.schemas import (
    OfferSummary,
    PricePoint,
    ProductDetailResponse,
    ProductSearchResponse,
    ProductSearchResult,
    ProductSitemapEntry,
    ProductSitemapResponse,
)
from app.schemas.products import TopProduct, TopProductsResponse
from app.services.products_service import (
    get_product_detail,
    get_top_products,
    list_sitemap_entries,
    record_product_view,
    search_products,
)


def _offer_summary(offer: Offer) -> OfferSummary:
    return OfferSummary(
        id=offer.id,
        vendor_id=offer.vendor_id,
        vendor_name=offer.vendor.name,
        price=offer.price,
        currency="TND",
        stock_status=offer.stock_status,
        url=offer.url,
        shipping_cost=offer.shipping_cost,
        scraped_at=offer.scraped_at.isoformat(),
    )


def search_products_controller(
    session: Session,
    *,
    query: str | None,
    category: str | None,
    brand: str | None = None,
    ram_gb: int | None = None,
    max_price: Decimal | None = None,
    limit: int,
    offset: int,
) -> ProductSearchResponse:
    results = search_products(
        session,
        query=query,
        category=category,
        brand=brand,
        ram_gb=ram_gb,
        max_price=max_price,
        limit=limit,
        offset=offset,
    )

    out = [
        ProductSearchResult(
            id=result.product.id,
            canonical_name=result.product.canonical_name,
            brand=result.product.brand,
            model=result.product.model,
            category=result.product.category,
            image_url=result.product.image_url,
            best_deal=_offer_summary(result.best_deal),
            offers_count=result.offers_count,
        )
        for result in results
    ]
    return ProductSearchResponse(count=len(out), results=out)


def get_top_products_controller(session: Session, *, limit: int) -> TopProductsResponse:
    top = get_top_products(session, limit=limit)
    return TopProductsResponse(
        mode=top.mode,
        period_days=top.period_days,
        results=[
            TopProduct(
                id=item.product.id,
                canonical_name=item.product.canonical_name,
                brand=item.product.brand,
                model=item.product.model,
                image_url=item.product.image_url,
                best_deal=_offer_summary(item.best_deal),
                offers_count=item.offers_count,
                price_spread=item.price_spread,
                views=item.views,
            )
            for item in top.items
        ],
    )


def record_product_view_controller(session: Session, product_id: str) -> None:
    record_product_view(session, product_id)


def get_product_detail_controller(session: Session, product_id: str) -> ProductDetailResponse:
    detail = get_product_detail(session, product_id)

    return ProductDetailResponse(
        id=detail.product.id,
        canonical_name=detail.product.canonical_name,
        brand=detail.product.brand,
        model=detail.product.model,
        category=detail.product.category,
        specs=detail.product.specs,
        image_url=detail.product.image_url,
        best_deal=_offer_summary(detail.best_deal),
        offers=[_offer_summary(offer) for offer in detail.offers],
        price_history=[
            PricePoint(offer_id=point.offer_id, price=point.price, recorded_at=point.recorded_at.isoformat())
            for point in detail.price_history
        ],
    )


def _utc_iso(value: datetime) -> str:
    """Les colonnes timestamp de Prisma stockent de l'UTC sans fuseau : sans le
    "+00:00", un client JavaScript lirait l'heure comme locale (decalage)."""
    return (value if value.tzinfo else value.replace(tzinfo=UTC)).isoformat()


def list_sitemap_entries_controller(session: Session) -> ProductSitemapResponse:
    entries = [
        ProductSitemapEntry(id=entry.product_id, last_modified=_utc_iso(entry.last_modified))
        for entry in list_sitemap_entries(session)
    ]
    return ProductSitemapResponse(count=len(entries), results=entries)
