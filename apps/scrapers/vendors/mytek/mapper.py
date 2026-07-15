"""Transforme les donnees brutes extraites du DOM MyTek en objet Offer standard.

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

VENDOR = "mytek"
CURRENCY = "TND"
MEDIA_BASE_URL = "https://www.mytek.tn/media/catalog/product"

_STOCK_IN_TEXT = {"en stock"}
_STOCK_OUT_KEYWORDS = ("puis", "rupture")


def parse_price(raw_text: str | None) -> Decimal | None:
    """"1899" / "1 899,000 DT" -> Decimal("1899") / Decimal("1899.000")."""
    if not raw_text:
        return None
    cleaned = raw_text.replace("\xa0", " ").strip()
    cleaned = re.sub(r"[^\d,.\s]", "", cleaned)
    cleaned = cleaned.replace(" ", "").replace(",", ".")
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def parse_stock_status(*, availability_href: str | None = None, stock_text: str | None = None) -> str:
    if availability_href:
        href = availability_href.rstrip("/")
        if href.endswith("InStock"):
            return "in_stock"
        if href.endswith("OutOfStock"):
            return "out_of_stock"
    if stock_text:
        normalized = stock_text.strip().lower()
        if normalized in _STOCK_IN_TEXT:
            return "in_stock"
        if any(keyword in normalized for keyword in _STOCK_OUT_KEYWORDS):
            return "out_of_stock"
    return "unknown"


def clean_reference(raw_reference: str | None) -> str | None:
    if not raw_reference:
        return None
    return raw_reference.strip() or None


def resolve_image_url(raw_image: str | None) -> str | None:
    if not raw_image:
        return None
    if raw_image.startswith("http://") or raw_image.startswith("https://"):
        return raw_image
    return f"{MEDIA_BASE_URL}/{raw_image.lstrip('/')}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def map_listing_item(raw: dict[str, Any], *, category: str) -> dict[str, Any] | None:
    price = parse_price(raw.get("final_price"))
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
        "stock_status": parse_stock_status(stock_text=raw.get("stock_text")),
        "url": url,
        "image_url": resolve_image_url(raw.get("image_url")),
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
        "currency": raw.get("currency") or CURRENCY,
        "stock_status": parse_stock_status(availability_href=raw.get("availability_href")),
        "url": url,
        "image_url": raw.get("image_url") or None,
        "shipping_cost": None,
        "scraped_at": _now_iso(),
    }
