"""Caracterisation : scrape_category sur la page listing smartphones enregistree le 2026-10-03.

Hors reseau (cf. conftest.py racine). Fige ce que le scraper extrait de ce HTML
reel ; un echec apres mise a jour de la fixture ou des selecteurs signale un
changement de parsing a examiner.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import pytest

from vendors.spacenet.scraper import SpacenetScraper

LISTING_URL = "https://www.spacenet.tn/130-smartphone-tunisie"
FIXTURE = Path(__file__).parent.parent / "fixtures" / "listing_smartphones.html"


@pytest.fixture(scope="module")
def run(scrape_offline):
    return scrape_offline(SpacenetScraper, {LISTING_URL: FIXTURE}, lambda s: s.scrape_category("smartphones"))


def test_extracts_each_card_once_despite_grid_and_list_duplicates(run) -> None:
    assert len(run.result) == 32
    assert len({offer["external_id"] for offer in run.result}) == 32
    assert run.failures == []


def test_follows_next_page_then_the_iphone_category(run) -> None:
    assert run.requested_urls == [
        LISTING_URL,
        f"{LISTING_URL}?page=2",
        "https://www.spacenet.tn/211-iphone-tunisie",
    ]


def test_first_offer_is_mapped_field_by_field(run) -> None:
    first = {key: value for key, value in run.result[0].items() if key != "scraped_at"}
    assert first == {
        "vendor": "spacenet",
        "external_id": "99066",
        "product_name": "Smartphone Lesia Young 1 2Go 16Go Bleu Ciel",
        "brand": "Lesia",
        "category": "smartphones",
        "reference": "LESIA-YOUNG1-SKYBLUE",
        "price": 169.0,
        "currency": "TND",
        "stock_status": "in_stock",
        "url": "https://spacenet.tn/smartphone-tunisie/99066-smartphone-lesia-young-1-2go-16go-bleu-ciel.html",
        "image_url": "https://spacenet.tn/354977-large_default/smartphone-lesia-young-1-2go-16go-bleu-ciel.jpg",
        "shipping_cost": None,
    }


def test_last_offer_keeps_page_order(run) -> None:
    last = run.result[-1]
    assert (last["external_id"], last["product_name"], last["brand"], last["price"]) == (
        "97643",
        "Smartphone Itel City 12Go (4Go + 8Go Extensible ) 128Go Titanium",
        "Itel Mobile",
        399.0,
    )


def test_every_offer_is_complete_and_priced(run) -> None:
    """Les URLs sortent sans "www." alors que la page listing est servie sur www.spacenet.tn."""
    for offer in run.result:
        assert offer["price"] > 0, offer
        assert offer["brand"] and offer["reference"] and offer["product_name"], offer
        assert offer["url"].startswith("https://spacenet.tn/"), offer
        assert "-large_default/" in offer["image_url"], offer
    assert min(o["price"] for o in run.result) == 169.0
    assert max(o["price"] for o in run.result) == 399.0


def test_stock_statuses(run) -> None:
    assert Counter(offer["stock_status"] for offer in run.result) == {"in_stock": 18, "unknown": 14}
