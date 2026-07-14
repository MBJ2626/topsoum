from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas import OfferOut, ProductSearchResponse
from app.services.products_service import search_products


def search_products_controller(
    session: Session,
    *,
    query: str | None,
    category: str | None,
    limit: int,
    offset: int,
) -> ProductSearchResponse:
    results = search_products(session, query=query, category=category, limit=limit, offset=offset)
    offers_out = [OfferOut(**result.__dict__) for result in results]
    return ProductSearchResponse(count=len(offers_out), results=offers_out)
