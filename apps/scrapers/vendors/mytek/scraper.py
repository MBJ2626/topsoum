from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

from playwright.sync_api import ElementHandle, Page

from core.base_scraper import BaseScraper
from vendors.mytek import mapper, selectors


class MytekScraper(BaseScraper):
    """Scraper MyTek. N'importe et n'est importe par aucun autre vendors/*."""

    vendor = "mytek"
    base_url = "https://www.mytek.tn"

    def scrape_category(self, category: str, limit: int | None = None) -> list[dict[str, Any]]:
        slugs = selectors.CATEGORY_SLUGS.get(category)
        if not slugs:
            raise ValueError(f"Categorie inconnue pour mytek: {category!r}")

        offers: list[dict[str, Any]] = []
        # Un meme produit peut figurer sur deux pages de la categorie.
        seen_ids: set[str] = set()
        for slug in slugs:
            if limit is not None and len(offers) >= limit:
                break
            # Un onglet (contexte, donc cookies) neuf par page de listing : apres
            # smartphone.html, MyTek sert iphone.html SANS le bloc
            # #seo-product-data dans le meme contexte (0 produit), alors qu'un
            # contexte vierge le recoit (verifie le 2026-10-01).
            page = self.new_page()
            try:
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
        """Parcourt une page de listing et ses pages suivantes (lien de pagination)."""
        url: str | None = f"{self.base_url}/{slug}"
        while url is not None and (limit is None or len(offers) < limit):
            if not self.goto(page, url):
                return

            items = page.query_selector_all(selectors.LISTING_PRODUCT_ITEM)
            if not items:
                return

            for item in items:
                raw = self._extract_listing_item(item)
                offer = mapper.map_listing_item(raw, category=category)
                if offer is not None and offer["external_id"] not in seen_ids:
                    seen_ids.add(offer["external_id"])
                    offers.append(offer)
                if limit is not None and len(offers) >= limit:
                    return

            next_link = page.query_selector(selectors.LISTING_NEXT_PAGE_LINK)
            next_href = next_link.get_attribute("href") if next_link else None
            url = urljoin(self.base_url, next_href) if next_href else None

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

    def _extract_listing_item(self, item: ElementHandle) -> dict[str, Any]:
        return {
            "external_id": item.get_attribute("data-id"),
            "name": item.get_attribute("data-name"),
            "url": item.get_attribute("data-url"),
            "reference": item.get_attribute("data-sku"),
            "final_price": item.get_attribute("data-final-price"),
            "image_url": item.get_attribute("data-image"),
            "stock_text": item.get_attribute("data-erpstock"),
            "brand": item.get_attribute("data-manufacturer"),
        }

    def _extract_product_page(self, page: Page) -> dict[str, Any]:
        id_input = page.query_selector(selectors.PRODUCT_ID_INPUT)
        name_el = page.query_selector(selectors.PRODUCT_NAME)
        price_meta = page.query_selector(selectors.PRODUCT_PRICE_META)
        currency_meta = page.query_selector(selectors.PRODUCT_CURRENCY_META)
        availability_el = page.query_selector(selectors.PRODUCT_AVAILABILITY_LINK)
        reference_el = page.query_selector(selectors.PRODUCT_REFERENCE)
        brand_el = page.query_selector(selectors.PRODUCT_BRAND_LOGO)
        image_el = page.query_selector(selectors.PRODUCT_IMAGE_META)

        return {
            "external_id": id_input.get_attribute("value") if id_input else None,
            "name": name_el.text_content() if name_el else None,
            "price_text": price_meta.get_attribute("content") if price_meta else None,
            "currency": currency_meta.get_attribute("content") if currency_meta else None,
            "availability_href": availability_el.get_attribute("href") if availability_el else None,
            "reference": reference_el.text_content() if reference_el else None,
            "brand": brand_el.get_attribute("alt") if brand_el else None,
            "image_url": image_el.get_attribute("content") if image_el else None,
        }

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
