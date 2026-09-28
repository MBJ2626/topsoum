"""Fabriques ORM en memoire, partagees entre tests unitaires (aucune DB,
aucune session SQLAlchemy) : construisent des graphes d'objets suffisants
pour exercer scoring.py et les services qui le consomment.
"""

from __future__ import annotations

from decimal import Decimal

from app.repositories.models import Favorite, Offer, Product, Vendor


def make_offer(
    *,
    price: str,
    shipping_cost: str | None,
    trust_score: float | None,
    stock_status: str,
    id: str = "o1",
    product_id: str = "p1",
    vendor_id: str = "v1",
    vendor_name: str = "Test Vendor",
) -> Offer:
    vendor = Vendor(id=vendor_id, name=vendor_name, logo=None, trust_score=trust_score, avg_delivery_time=None)
    offer = Offer(
        id=id,
        product_id=product_id,
        vendor_id=vendor_id,
        price=Decimal(price),
        stock_status=stock_status,
        url="https://example.tn/produit",
        shipping_cost=Decimal(shipping_cost) if shipping_cost is not None else None,
        scraped_at=None,
    )
    offer.vendor = vendor
    return offer


def make_product(*, id: str = "p1", offers: list[Offer], brand: str = "Test", model: str = "Model") -> Product:
    product = Product(
        id=id,
        brand=brand,
        model=model,
        category="smartphones",
        specs={},
        canonical_name=f"{brand}-{model}".lower(),
        image_url=None,
        created_at=None,
        updated_at=None,
    )
    product.offers = offers
    for offer in offers:
        offer.product_id = id
    return product


def make_favorite(*, id: str = "f1", user_id: str = "u1", product: Product, price_tracking: bool = False) -> Favorite:
    favorite = Favorite(id=id, user_id=user_id, product_id=product.id, price_tracking=price_tracking, created_at=None)
    favorite.product = product
    return favorite
