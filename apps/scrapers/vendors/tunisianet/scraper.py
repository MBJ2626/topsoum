from __future__ import annotations

from typing import Any

from playwright.sync_api import ElementHandle, Page

from core.base_scraper import BaseScraper
from vendors.tunisianet import mapper, selectors


class TunisianetScraper(BaseScraper):
    """Scraper Tunisianet. N'importe et n'est importe par aucun autre vendors/*."""

    vendor = "tunisianet"
    base_url = "https://www.tunisianet.com.tn"

    def scrape_category(self, category: str, limit: int | None = None) -> list[dict[str, Any]]:
        slug = selectors.CATEGORY_SLUGS.get(category)
        if slug is None:
            raise ValueError(f"Categorie inconnue pour tunisianet: {category!r}")

        offers: list[dict[str, Any]] = []
        page = self.new_page()
        try:
            page_number = 1
            while limit is None or len(offers) < limit:
                url = f"{self.base_url}/{slug}"
                if page_number > 1:
                    url = f"{url}?page={page_number}"

                if not self.goto(page, url):
                    break

                cards = page.query_selector_all(selectors.LISTING_PRODUCT_CARD)
                if not cards:
                    break

                for card in cards:
                    raw = self._extract_listing_card(card)
                    offer = mapper.map_listing_item(raw, category=category)
                    if offer is not None:
                        offers.append(offer)
                    if limit is not None and len(offers) >= limit:
                        break

                has_next = page.query_selector(selectors.LISTING_NEXT_PAGE_LINK) is not None
                if (limit is not None and len(offers) >= limit) or not has_next:
                    break
                page_number += 1
        finally:
            page.close()

        return offers

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
            "stock_class": stock_el.get_attribute("class") if stock_el else None,
            "image_url": image_el.get_attribute("src") if image_el else None,
            "brand": brand_el.get_attribute("alt") if brand_el else None,
        }

    def _extract_product_page(self, page: Page) -> dict[str, Any]:
        id_input = page.query_selector(selectors.PRODUCT_ID_INPUT)
        name_el = page.query_selector(selectors.PRODUCT_NAME)
        price_el = page.query_selector(selectors.PRODUCT_PRICE)
        availability_el = page.query_selector(selectors.PRODUCT_AVAILABILITY_LINK)
        stock_el = page.query_selector(selectors.PRODUCT_STOCK_FALLBACK)
        reference_el = page.query_selector(selectors.PRODUCT_REFERENCE)
        brand_el = page.query_selector(selectors.PRODUCT_BRAND_LOGO)
        image_el = page.query_selector(selectors.PRODUCT_IMAGE_META)

        return {
            "external_id": id_input.get_attribute("value") if id_input else None,
            "name": name_el.text_content() if name_el else None,
            "price_text": price_el.text_content() if price_el else None,
            "availability_href": availability_el.get_attribute("href") if availability_el else None,
            "stock_class": stock_el.get_attribute("class") if stock_el else None,
            "reference": reference_el.text_content() if reference_el else None,
            "brand": brand_el.get_attribute("alt") if brand_el else None,
            "image_url": image_el.get_attribute("content") if image_el else None,
        }

    def _resolve_category(self, page: Page) -> str:
        """Deduit la categorie a partir du fil d'ariane, via CATEGORY_SLUGS."""
        for link in page.query_selector_all(selectors.PRODUCT_BREADCRUMB_LINKS):
            href = (link.get_attribute("href") or "").rstrip("/")
            for category, slug in selectors.CATEGORY_SLUGS.items():
                if href.endswith(slug):
                    return category
        return "unknown"
