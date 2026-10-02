"""Mapping SQLAlchemy en lecture des tables gerees par packages/db-schema (Prisma).

Prisma reste la source de verite du schema (migrations) ; ces modeles ne
font que decrire les tables/colonnes existantes pour que l'API puisse lire.
"""

from __future__ import annotations

import datetime
import decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# Type Postgres deja cree par la migration Prisma (create_type=False) : ne
# jamais laisser SQLAlchemy tenter un CREATE TYPE, Prisma reste la source de
# verite du schema.
pending_match_status_enum = Enum(
    "pending", "approved", "rejected", "merged", name="PendingMatchStatus", create_type=False
)


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    logo: Mapped[str | None]
    trust_score: Mapped[float | None]
    avg_delivery_time: Mapped[int | None]


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(primary_key=True)
    brand: Mapped[str]
    model: Mapped[str]
    category: Mapped[str]
    specs: Mapped[dict] = mapped_column(JSONB)
    canonical_name: Mapped[str]
    image_url: Mapped[str | None]
    created_at: Mapped[datetime.datetime]
    updated_at: Mapped[datetime.datetime]

    offers: Mapped[list["Offer"]] = relationship(back_populates="product")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="product")


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[str] = mapped_column(primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    vendor_id: Mapped[str] = mapped_column(ForeignKey("vendors.id"))
    price: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 3))
    stock_status: Mapped[str]
    url: Mapped[str]
    shipping_cost: Mapped[decimal.Decimal | None] = mapped_column(Numeric(10, 3))
    scraped_at: Mapped[datetime.datetime]

    product: Mapped[Product] = relationship(back_populates="offers")
    vendor: Mapped[Vendor] = relationship()
    price_history: Mapped[list["PriceHistory"]] = relationship(back_populates="offer")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    email: Mapped[str]
    name: Mapped[str | None]
    is_admin: Mapped[bool]
    created_at: Mapped[datetime.datetime]


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    price_tracking: Mapped[bool]
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())

    user: Mapped[User] = relationship()
    product: Mapped[Product] = relationship(back_populates="favorites")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[str] = mapped_column(primary_key=True)
    offer_id: Mapped[str] = mapped_column(ForeignKey("offers.id"))
    price: Mapped[decimal.Decimal] = mapped_column(Numeric(10, 3))
    recorded_at: Mapped[datetime.datetime]

    offer: Mapped[Offer] = relationship(back_populates="price_history")


class ScraperRun(Base):
    __tablename__ = "scraper_runs"

    id: Mapped[str] = mapped_column(primary_key=True)
    vendor_id: Mapped[str] = mapped_column(ForeignKey("vendors.id"))
    started_at: Mapped[datetime.datetime]
    finished_at: Mapped[datetime.datetime | None]
    products_collected: Mapped[int]
    success_count: Mapped[int]
    error_count: Mapped[int]

    vendor: Mapped[Vendor] = relationship()


class PendingMatch(Base):
    __tablename__ = "pending_matches"

    id: Mapped[str] = mapped_column(primary_key=True)
    vendor_slug: Mapped[str]
    external_id: Mapped[str | None]
    reference: Mapped[str | None]
    offer_product_name: Mapped[str]
    category: Mapped[str]
    created_product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    candidate_product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    confidence: Mapped[float]
    strategy: Mapped[str]
    status: Mapped[str] = mapped_column(pending_match_status_enum)
    resolved_product_id: Mapped[str | None]
    resolved_at: Mapped[datetime.datetime | None]
    created_at: Mapped[datetime.datetime]

    created_product: Mapped[Product] = relationship(foreign_keys=[created_product_id])
    candidate_product: Mapped[Product] = relationship(foreign_keys=[candidate_product_id])


class ManualOverride(Base):
    __tablename__ = "manual_overrides"

    id: Mapped[str] = mapped_column(primary_key=True)
    vendor_slug: Mapped[str]
    external_id: Mapped[str | None]
    reference: Mapped[str | None]
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())

    product: Mapped[Product] = relationship()


class ScanJob(Base):
    """Scan demande (dashboard ou planification), execute par le worker etl-pipeline."""

    __tablename__ = "scan_jobs"

    id: Mapped[str] = mapped_column(primary_key=True)
    status: Mapped[str]
    trigger: Mapped[str]
    vendors: Mapped[list[str]] = mapped_column(ARRAY(String))
    scheduled_for: Mapped[datetime.datetime | None]
    requested_at: Mapped[datetime.datetime]
    started_at: Mapped[datetime.datetime | None]
    finished_at: Mapped[datetime.datetime | None]
    results: Mapped[list | None] = mapped_column(JSONB)
    error: Mapped[str | None]


class ScanSchedule(Base):
    __tablename__ = "scan_schedules"

    id: Mapped[str] = mapped_column(primary_key=True)
    enabled: Mapped[bool]
    times: Mapped[list[str]] = mapped_column(ARRAY(String))
    configured_at: Mapped[datetime.datetime]
    worker_seen_at: Mapped[datetime.datetime | None]


class ProductEvent(Base):
    """Evenement d'audience anonyme (view | offer_click) pour "Les plus consultes"."""

    __tablename__ = "product_events"

    id: Mapped[str] = mapped_column(primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    type: Mapped[str]
    created_at: Mapped[datetime.datetime]
