"""Caracterisation : scrape_category sur la page listing smartphones enregistree le 2026-10-03.

Hors reseau (cf. conftest.py racine). Fige ce que le scraper extrait de ce HTML
reel ; un echec apres mise a jour de la fixture ou des selecteurs signale un
changement de parsing a examiner.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import pytest

from vendors.tunisianet.scraper import TunisianetScraper

LISTING_URL = "https://www.tunisianet.com.tn/596-smartphone-tunisie"
FIXTURE = Path(__file__).parent.parent / "fixtures" / "listing_smartphones.html"


@pytest.fixture(scope="module")
def run(scrape_offline):
    return scrape_offline(TunisianetScraper, {LISTING_URL: FIXTURE}, lambda s: s.scrape_category("smartphones"))


def test_extracts_every_card_of_the_page(run) -> None:
    assert len(run.result) == 24
    assert len({offer["external_id"] for offer in run.result}) == 24
    assert run.failures == []


def test_follows_next_page_link_then_stops_on_empty_page(run) -> None:
    assert run.requested_urls == [LISTING_URL, f"{LISTING_URL}?page=2"]


def test_first_offer_is_mapped_field_by_field(run) -> None:
    first = {key: value for key, value in run.result[0].items() if key != "scraped_at"}
    assert first == {
        "vendor": "tunisianet",
        "external_id": "91033",
        "product_name": "Smartphone Lesia Young 1 | 2Go / 16Go | Bleu",
        "brand": "Lesia",
        "category": "smartphones",
        "reference": "LESIA-YOUNG1-BL",
        "price": 169.0,
        "currency": "TND",
        "stock_status": "in_stock",
        "url": "https://www.tunisianet.com.tn/smartphone-tunisie/91033-smartphone-lesia-young-1-2go-16go-bleu.html",
        "image_url": "https://www.tunisianet.com.tn/455543-large_default/smartphone-lesia-young-1-2go-16go-bleu.jpg",
        "shipping_cost": None,
    }


def test_last_offer_keeps_page_order(run) -> None:
    last = run.result[-1]
    assert (last["external_id"], last["product_name"], last["price"]) == (
        "99458",
        "SMARTPHONE HONOR PLAY 20C 8Go / 64Go / Noir",
        459.0,
    )


def test_every_offer_is_complete_and_priced(run) -> None:
    for offer in run.result:
        assert offer["price"] > 0, offer
        assert offer["brand"] and offer["reference"] and offer["product_name"], offer
        assert offer["url"].startswith("https://www.tunisianet.com.tn/"), offer
        assert "-large_default/" in offer["image_url"], offer
    assert min(o["price"] for o in run.result) == 169.0
    assert max(o["price"] for o in run.result) == 459.0


def test_stock_statuses(run) -> None:
    assert Counter(offer["stock_status"] for offer in run.result) == {"in_stock": 24}
