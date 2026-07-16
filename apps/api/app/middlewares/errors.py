"""Traduit les exceptions de domaine (app/errors.py) en reponses HTTP.
Centralise cette traduction en un seul endroit : les controllers/services ne
font jamais de try/except pour ca."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.errors import (
    FavoriteAlreadyExistsError,
    FavoriteNotFoundError,
    OfferNotFoundError,
    PendingMatchAlreadyResolvedError,
    PendingMatchNotFoundError,
    ProductNotFoundError,
)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProductNotFoundError)
    def _product_not_found(request: Request, exc: ProductNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": f"Produit introuvable: {exc}"})

    @app.exception_handler(OfferNotFoundError)
    def _offer_not_found(request: Request, exc: OfferNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": f"Offre introuvable: {exc}"})

    @app.exception_handler(FavoriteNotFoundError)
    def _favorite_not_found(request: Request, exc: FavoriteNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": f"Favori introuvable: {exc}"})

    @app.exception_handler(FavoriteAlreadyExistsError)
    def _favorite_already_exists(request: Request, exc: FavoriteAlreadyExistsError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": f"Favori deja existant: {exc}"})

    @app.exception_handler(PendingMatchNotFoundError)
    def _pending_match_not_found(request: Request, exc: PendingMatchNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": f"Match introuvable: {exc}"})

    @app.exception_handler(PendingMatchAlreadyResolvedError)
    def _pending_match_already_resolved(request: Request, exc: PendingMatchAlreadyResolvedError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": f"Match deja resolu: {exc}"})
