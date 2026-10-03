"""Caracterisation : application de robots.txt par BaseScraper (hors reseau)."""

from __future__ import annotations

import urllib.robotparser
from typing import Any

import pytest

from core.base_scraper import BaseScraper, ScraperConfig

# Extrait du robots.txt de mytek.tn (ligne 3, verifie le 2026-10-03).
MYTEK_RULES = ["User-agent: *", "Disallow: /*?", "Disallow: /checkout/"]


class _Scraper(BaseScraper):
    vendor = "test"
    base_url = "https://www.mytek.tn"

    def scrape_category(self, category: str, limit: int | None = None) -> list[dict[str, Any]]:
        return []

    def scrape_product(self, url: str) -> dict[str, Any] | None:
        return None


@pytest.fixture
def scraper(monkeypatch: pytest.MonkeyPatch) -> _Scraper:
    parser = urllib.robotparser.RobotFileParser()
    parser.parse(MYTEK_RULES)
    monkeypatch.setattr(BaseScraper, "_load_robots_txt", lambda self: parser)
    return _Scraper(ScraperConfig(min_delay_seconds=0))


def test_plain_path_rule_is_enforced(scraper: _Scraper) -> None:
    assert scraper._is_allowed("https://www.mytek.tn/checkout/cart") is False
    assert scraper._is_allowed("https://www.mytek.tn/smartphone.html") is True


def test_wildcard_rule_blocks_mytek_pagination(scraper: _Scraper) -> None:
    """Le joker "*" n'est gere par urllib.robotparser que depuis Python 3.13/3.14
    (3.12.14 l'ignore) : d'ou la version imposee dans .python-version et
    requires-python. Sans elle, la pagination MyTek interdite serait scrapee."""
    assert scraper._is_allowed("https://www.mytek.tn/smartphone.html?categoryId=82&p=2") is False
