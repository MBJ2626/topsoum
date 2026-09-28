"""Endpoints uniquement, zero logique : delegue tout a products_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.controllers.products_controller import (
    get_product_detail_controller,
    list_sitemap_entries_controller,
    search_products_controller,
)
from app.repositories.database import get_session
from app.schemas import ProductDetailResponse, ProductSearchResponse, ProductSitemapResponse

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


# Declaree AVANT /{product_id} : sinon "sitemap" serait pris pour un id produit.
@router.get("/sitemap", response_model=ProductSitemapResponse)
def sitemap(session: Session = Depends(get_session)) -> ProductSitemapResponse:
    return list_sitemap_entries_controller(session)


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_detail(
    product_id: str,
    session: Session = Depends(get_session),
) -> ProductDetailResponse:
    return get_product_detail_controller(session, product_id)
