"""Transforme les donnees brutes extraites du DOM Tunisianet en objet Offer standard.

Contrat de sortie (partage avec le pipeline ETL, cf. packages/shared-types
ScrapedOffer) :
    vendor, external_id, product_name, brand, category, reference,
    price, currency, stock_status, url, image_url, shipping_cost, scraped_at
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

VENDOR = "tunisianet"
CURRENCY = "TND"

_STOCK_IN = {"in-stock"}
_STOCK_OUT = {"out-of-stock", "out-of-stock-webonly"}


def parse_price(raw_text: str | None) -> Decimal | None:
    """"169,000 DT" / "1 299,000 DT" / "3 249,000 DT" -> Decimal("169.000") /
    Decimal("1299.000") / Decimal("3249.000"). Le theme Tunisianet utilise
    l'espace fine insecable (U+202F) comme separateur de milliers sur les prix
    a 4 chiffres et plus - on retire tout caractere hors chiffres/virgule/point
    en un seul passage plutot que de lister les variantes d'espaces Unicode."""
    if not raw_text:
        return None
    cleaned = re.sub(r"[^\d,.]", "", raw_text)
    cleaned = cleaned.replace(",", ".")
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def parse_stock_status(stock_class: str | None, availability_href: str | None = None) -> str:
    if availability_href:
        if availability_href.rstrip("/").endswith("InStock"):
            return "in_stock"
        if availability_href.rstrip("/").endswith("OutOfStock"):
            return "out_of_stock"
    if stock_class:
        normalized = stock_class.strip().lower()
        if normalized in _STOCK_IN:
            return "in_stock"
        if normalized in _STOCK_OUT:
            return "out_of_stock"
    return "unknown"


def clean_reference(raw_reference: str | None) -> str | None:
    if not raw_reference:
        return None
    return raw_reference.strip().strip("[]").strip() or None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def map_listing_item(raw: dict[str, Any], *, category: str) -> dict[str, Any] | None:
    price = parse_price(raw.get("price_text"))
    external_id = raw.get("external_id")
    url = raw.get("url")
    if price is None or not external_id or not url:
        return None

    return {
        "vendor": VENDOR,
        "external_id": str(external_id),
        "product_name": (raw.get("name") or "").strip(),
        "brand": (raw.get("brand") or "").strip() or None,
        "category": category,
        "reference": clean_reference(raw.get("reference")),
        "price": float(price),
        "currency": CURRENCY,
        "stock_status": parse_stock_status(raw.get("stock_class")),
        "url": url,
        "image_url": raw.get("image_url") or None,
        "shipping_cost": None,
        "scraped_at": _now_iso(),
    }


def map_product_page(raw: dict[str, Any], *, category: str, url: str) -> dict[str, Any] | None:
    price = parse_price(raw.get("price_text"))
    external_id = raw.get("external_id")
    if price is None or not external_id:
        return None

    return {
        "vendor": VENDOR,
        "external_id": str(external_id),
        "product_name": (raw.get("name") or "").strip(),
        "brand": (raw.get("brand") or "").strip() or None,
        "category": category,
        "reference": clean_reference(raw.get("reference")),
        "price": float(price),
        "currency": CURRENCY,
        "stock_status": parse_stock_status(raw.get("stock_class"), raw.get("availability_href")),
        "url": url,
        "image_url": raw.get("image_url") or None,
        "shipping_cost": None,
        "scraped_at": _now_iso(),
    }
