"""Caracterisation : scrape_category sur la page listing smartphones enregistree le 2026-10-03.

Hors reseau (cf. conftest.py racine). Fige ce que le scraper extrait de ce HTML
reel ; un echec apres mise a jour de la fixture ou des selecteurs signale un
changement de parsing a examiner.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import pytest

from vendors.mytek.scraper import MytekScraper

LISTING_URL = "https://www.mytek.tn/smartphone.html"
IPHONE_URL = "https://www.mytek.tn/telephonie-tunisie/smartphone-mobile-tunisie/iphone.html"
FIXTURE = Path(__file__).parent.parent / "fixtures" / "listing_smartphones.html"


@pytest.fixture(scope="module")
def run(scrape_offline):
    return scrape_offline(MytekScraper, {LISTING_URL: FIXTURE}, lambda s: s.scrape_category("smartphones"))


def test_extracts_every_item_of_the_page(run) -> None:
    assert len(run.result) == 48
    assert len({offer["external_id"] for offer in run.result}) == 48
    assert run.failures == []


def test_follows_pagination_link_then_the_iphone_page(run) -> None:
    """La page 2 porte une query string : voir core/tests/test_robots.py pour
    son blocage par le robots.txt de MyTek (ici, robots.txt est neutralise)."""
    assert run.requested_urls == [
        LISTING_URL,
        "https://www.mytek.tn/smartphone.html?categoryId=82&p=2",
        IPHONE_URL,
    ]


def test_first_offer_is_mapped_field_by_field(run) -> None:
    first = {key: value for key, value in run.result[0].items() if key != "scraped_at"}
    assert first == {
        "vendor": "mytek",
        "external_id": "67114",
        "product_name": "Smartphone LESIA YOUNG 1 2Go 16Go - Bleu Foncé",
        "brand": "LESIA",
        "category": "smartphones",
        "reference": "YOUNG1-2/16-DBLUE",
        "price": 169.9,
        "currency": "TND",
        "stock_status": "in_stock",
        "url": "https://www.mytek.tn/smartphone-lesia-young-1-2go-16go-bleu-fonce.html",
        "image_url": "https://www.mytek.tn/media/catalog/product/s/m/smartphone-lesia-young-1-2go-16go-bleu-fonce-1.jpg",
        "shipping_cost": None,
    }


def test_last_offer_keeps_page_order(run) -> None:
    last = run.result[-1]
    assert (last["external_id"], last["product_name"], last["price"], last["stock_status"]) == (
        "85090",
        "Smartphone SAMSUNG GALAXY A06 5G 12Go 128Go - Noir",
        499.0,
        "unknown",
    )


def test_every_offer_is_complete_and_priced(run) -> None:
    for offer in run.result:
        assert offer["price"] > 0, offer
        assert offer["brand"] and offer["reference"] and offer["product_name"], offer
        assert offer["url"].startswith("https://www.mytek.tn/"), offer
        assert offer["image_url"].startswith("https://www.mytek.tn/media/catalog/product/"), offer
    assert min(o["price"] for o in run.result) == 169.9
    assert max(o["price"] for o in run.result) == 499.0


def test_brand_keeps_vendor_casing(run) -> None:
    """La marque sort telle quelle ("LESIA", "SAMSUNG") : la normalisation est faite par l'ETL."""
    assert {"LESIA", "SAMSUNG"} <= {offer["brand"] for offer in run.result}


def test_stock_statuses(run) -> None:
    assert Counter(offer["stock_status"] for offer in run.result) == {"in_stock": 39, "out_of_stock": 6, "unknown": 3}
