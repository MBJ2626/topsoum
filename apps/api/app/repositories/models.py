"""Mapping SQLAlchemy en lecture des tables gerees par packages/db-schema (Prisma).

Prisma reste la source de verite du schema (migrations) ; ces modeles ne
font que decrire les tables/colonnes existantes pour que l'API puisse lire.
"""

from __future__ import annotations

import datetime
import decimal

from sqlalchemy import ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


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
