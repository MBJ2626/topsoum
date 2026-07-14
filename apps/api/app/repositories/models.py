"""Mapping SQLAlchemy en lecture des tables gerees par packages/db-schema (Prisma).

Prisma reste la source de verite du schema (migrations) ; ces modeles ne
font que decrire les tables/colonnes existantes pour que l'API puisse lire.
"""

from __future__ import annotations

import datetime
import decimal

from sqlalchemy import ForeignKey, Numeric
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
    canonical_name: Mapped[str]
    image_url: Mapped[str | None]


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

    product: Mapped[Product] = relationship()
    vendor: Mapped[Vendor] = relationship()
