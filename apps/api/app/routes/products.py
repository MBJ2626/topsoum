"""Endpoints uniquement, zero logique : delegue tout a products_controller."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.controllers.products_controller import search_products_controller
from app.repositories.database import get_session
from app.schemas import ProductSearchResponse

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
