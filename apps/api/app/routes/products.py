"""Endpoints uniquement, zero logique : delegue tout a products_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.controllers.products_controller import (
    get_product_detail_controller,
    get_top_products_controller,
    list_sitemap_entries_controller,
    record_product_view_controller,
    search_products_controller,
)
from app.repositories.database import get_session
from app.schemas import ProductDetailResponse, ProductSearchResponse, ProductSitemapResponse
from app.schemas.products import TopProductsResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/search", response_model=ProductSearchResponse)
def search(
    q: Annotated[str | None, Query(description="Recherche texte (nom, marque)")] = None,
    category: Annotated[str | None, Query(description="Filtre par categorie")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    session: Session = Depends(get_session),
) -> ProductSearchResponse:
    return search_products_controller(session, query=q, category=category, limit=limit, offset=offset)


# Declarees AVANT /{product_id} : sinon "sitemap" ou "top" seraient pris pour un id produit.
@router.get("/sitemap", response_model=ProductSitemapResponse)
def sitemap(session: Session = Depends(get_session)) -> ProductSitemapResponse:
    return list_sitemap_entries_controller(session)


@router.get("/top", response_model=TopProductsResponse)
def top_products(
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
    session: Session = Depends(get_session),
) -> TopProductsResponse:
    return get_top_products_controller(session, limit=limit)


@router.post("/{product_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_view(product_id: str, session: Session = Depends(get_session)) -> None:
    record_product_view_controller(session, product_id)


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_detail(
    product_id: str,
    session: Session = Depends(get_session),
) -> ProductDetailResponse:
    return get_product_detail_controller(session, product_id)
