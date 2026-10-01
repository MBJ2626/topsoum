from __future__ import annotations

import json
from typing import Any

from playwright.sync_api import ElementHandle, Page

from core.base_scraper import BaseScraper
from vendors.spacenet import mapper, selectors


class SpacenetScraper(BaseScraper):
    """Scraper Spacenet. N'importe et n'est importe par aucun autre vendors/*."""

    vendor = "spacenet"
    base_url = "https://www.spacenet.tn"

    def scrape_category(self, category: str, limit: int | None = None) -> list[dict[str, Any]]:
        slugs = selectors.CATEGORY_SLUGS.get(category)
        if not slugs:
            raise ValueError(f"Categorie inconnue pour spacenet: {category!r}")

        offers: list[dict[str, Any]] = []
        # Un meme produit peut figurer sur deux pages de la categorie.
        seen_ids: set[str] = set()
        page = self.new_page()
        try:
            for slug in slugs:
                if limit is not None and len(offers) >= limit:
                    break
                self._scrape_listing(page, slug, category, offers, seen_ids, limit)
        finally:
            page.close()

        return offers

    def _scrape_listing(
        self,
        page: Page,
        slug: str,
        category: str,
        offers: list[dict[str, Any]],
        seen_ids: set[str],
        limit: int | None,
    ) -> None:
        """Parcourt une page de listing et ses pages suivantes (?page=N)."""
        page_number = 1
        while limit is None or len(offers) < limit:
            url = f"{self.base_url}/{slug}"
            if page_number > 1:
                url = f"{url}?page={page_number}"

            if not self.goto(page, url):
                return

            cards = page.query_selector_all(selectors.LISTING_PRODUCT_CARD)
            if not cards:
                return

            for card in cards:
                raw = self._extract_listing_card(card)
                offer = mapper.map_listing_item(raw, category=category)
                if offer is not None and offer["external_id"] not in seen_ids:
                    seen_ids.add(offer["external_id"])
                    offers.append(offer)
                if limit is not None and len(offers) >= limit:
                    return

            if page.query_selector(selectors.LISTING_NEXT_PAGE_LINK) is None:
                return
            page_number += 1

    def scrape_product(self, url: str) -> dict[str, Any] | None:
        page = self.new_page()
        try:
            if not self.goto(page, url):
                return None
            raw = self._extract_product_page(page)
            category = self._resolve_category(page)
            return mapper.map_product_page(raw, category=category, url=url)
        finally:
            page.close()

    # -- extraction DOM (isolee du reste : n'utilise que selectors.py) ----

    def _extract_listing_card(self, card: ElementHandle) -> dict[str, Any]:
        name_link = card.query_selector(selectors.LISTING_NAME_LINK)
        stock_el = card.query_selector(selectors.LISTING_STOCK)
        image_el = card.query_selector(selectors.LISTING_IMAGE)
        brand_el = card.query_selector(selectors.LISTING_BRAND_LOGO)
        reference_el = card.query_selector(selectors.LISTING_REFERENCE)
        price_el = card.query_selector(selectors.LISTING_PRICE)

        return {
            "external_id": card.get_attribute("data-id-product"),
            "name": name_link.text_content() if name_link else None,
            "url": name_link.get_attribute("href") if name_link else None,
            "reference": reference_el.text_content() if reference_el else None,
            "price_text": price_el.text_content() if price_el else None,
            "stock_text": stock_el.text_content() if stock_el else None,
            "image_url": image_el.get_attribute("src") if image_el else None,
            "brand": brand_el.get_attribute("alt") if brand_el else None,
        }

    def _extract_product_page(self, page: Page) -> dict[str, Any]:
        """Le DOM expose des blocs de disponibilite incoherents selon l'etat du
        produit (cf. selectors.py) - on lit plutot le JSON-LD schema.org/Product,
        seule source fiable et uniforme quel que soit l'etat du stock."""
        product = self._find_product_json_ld(page)
        if product is None:
            return {}

        offers = product.get("offers") or {}
        brand = product.get("brand") or {}
        images = product.get("image")
        image_url = images[0] if isinstance(images, list) and images else images

        return {
            "external_id": product.get("productID"),
            "name": product.get("name"),
            "price_text": offers.get("price"),
            "currency": offers.get("priceCurrency"),
            "availability_href": offers.get("availability"),
            "reference": product.get("sku"),
            "brand": brand.get("name") if isinstance(brand, dict) else None,
            "image_url": image_url,
        }

    def _find_product_json_ld(self, page: Page) -> dict[str, Any] | None:
        for script in page.query_selector_all(selectors.PRODUCT_JSON_LD_SCRIPTS):
            raw = script.text_content()
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if isinstance(data, dict) and data.get("@type") == "Product":
                return data
        return None

    def _resolve_category(self, page: Page) -> str:
        """Deduit la categorie a partir du fil d'ariane, via CATEGORY_SLUGS puis,
        a defaut, CATEGORY_BREADCRUMB_ALIASES (cf. selectors.py)."""
        for link in page.query_selector_all(selectors.PRODUCT_BREADCRUMB_LINKS):
            href = (link.get_attribute("href") or "").rstrip("/")
            for category, slugs in selectors.CATEGORY_SLUGS.items():
                if any(href.endswith(slug.rstrip("/")) for slug in slugs):
                    return category
            for slug, category in selectors.CATEGORY_BREADCRUMB_ALIASES.items():
                if href.endswith(slug.rstrip("/")):
                    return category
        return "unknown"
