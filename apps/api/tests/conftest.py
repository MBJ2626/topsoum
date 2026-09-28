from __future__ import annotations

import uuid
from collections.abc import Iterator
from dataclasses import dataclass

import jwt
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.repositories.database import SessionLocal


def make_bearer_token(user_id: str, *, is_admin: bool = False) -> str:
    """Simule le token backend HS256 mine cote Next.js (voir apps/web/lib/auth-token.ts)."""
    payload = {"sub": user_id, "isAdmin": is_admin}
    return jwt.encode(payload, settings.api_auth_secret, algorithm="HS256")


def auth_headers(user_id: str, *, is_admin: bool = False) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_bearer_token(user_id, is_admin=is_admin)}"}


@pytest.fixture
def db_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@dataclass
class SeededCatalog:
    """Catalogue isole, propre a un test : un vendeur et des produits avec une offre chacun."""

    vendor_id: str
    product_ids: list[str]
    offer_ids: list[str]
    tag: str


@pytest.fixture
def seeded_catalog() -> Iterator[SeededCatalog]:
    """Cree ses propres lignes en DB de dev et les supprime ensuite.

    Les tests qui MODIFIENT des donnees (fusion de produits, reassignation
    d'offres...) doivent passer par cette fixture et jamais par les produits
    reels charges par l'ETL : sinon chaque run de pytest corrompt la DB de dev
    (offres rattachees au mauvais produit).
    """
    # Lettres uniquement : un tag commencant par un chiffre ("4ab1...") ferait
    # matcher les recherches numeriques des tests ("4", "16") sur le nom du produit.
    tag = "".join(chr(ord("a") + int(digit, 16)) for digit in uuid.uuid4().hex[:8])
    vendor_id = f"test-vendor-{tag}"
    models = [f"Testphone {tag} Alpha 2Go 16Go Noir", f"Testphone {tag} Beta 4Go 64Go Bleu", f"Testphone {tag} Gamma"]
    product_ids = [f"test-product-{tag}-{i}" for i in range(len(models))]
    offer_ids = [f"test-offer-{tag}-{i}" for i in range(len(models))]

    session = SessionLocal()
    try:
        session.execute(
            text("insert into vendors (id, name) values (:id, :name)"), {"id": vendor_id, "name": f"Vendeur {tag}"}
        )
        for index, (product_id, offer_id, model) in enumerate(zip(product_ids, offer_ids, models, strict=True)):
            session.execute(
                text(
                    "insert into products (id, brand, model, category, canonical_name, updated_at) "
                    "values (:id, 'TestBrand', :model, 'smartphones', :canonical, now())"
                ),
                {"id": product_id, "model": model, "canonical": product_id},
            )
            session.execute(
                text(
                    "insert into offers (id, product_id, vendor_id, price, url, scraped_at) "
                    "values (:id, :product_id, :vendor_id, :price, 'https://example.tn/test', now())"
                ),
                {"id": offer_id, "product_id": product_id, "vendor_id": vendor_id, "price": 100 + index},
            )
        session.commit()

        yield SeededCatalog(vendor_id=vendor_id, product_ids=product_ids, offer_ids=offer_ids, tag=tag)
    finally:
        session.rollback()
        params = {"vendor_id": vendor_id, "product_ids": product_ids}
        for statement in (
            "delete from price_history where offer_id in (select id from offers where vendor_id = :vendor_id)",
            "delete from offers where vendor_id = :vendor_id",
            "delete from pending_matches where created_product_id = any(:product_ids) "
            "or candidate_product_id = any(:product_ids)",
            "delete from manual_overrides where product_id = any(:product_ids)",
            "delete from favorites where product_id = any(:product_ids)",
            "delete from products where id = any(:product_ids)",
            "delete from vendors where id = :vendor_id",
        ):
            session.execute(text(statement), params)
        session.commit()
        session.close()
