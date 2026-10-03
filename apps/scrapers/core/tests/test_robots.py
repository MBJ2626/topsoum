"""Caracterisation : application de robots.txt par BaseScraper (hors reseau)."""

from __future__ import annotations

import sys
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


def _robotparser_supports_wildcards() -> bool:
    parser = urllib.robotparser.RobotFileParser()
    parser.parse(["User-agent: *", "Disallow: /*?"])
    return not parser.can_fetch("probe", "https://example.tn/page?p=2")


@pytest.mark.xfail(
    not _robotparser_supports_wildcards(),
    reason=f"Python {sys.version.split()[0]} : urllib.robotparser ignore le joker '*', "
    "la pagination MyTek interdite par robots.txt serait scrapee",
    strict=True,
)
def test_wildcard_rule_blocks_mytek_pagination(scraper: _Scraper) -> None:
    """Depend de l'interpreteur : urllib.robotparser applique "Disallow: /*?" sous
    Python 3.14.7 (venv actuel) mais l'ignore sous 3.9.6 ; 3.12 et 3.13 non
    verifies, alors que pyproject accepte ">=3.12" sans version epinglee. Sur un
    interpreteur sans joker, le test est marque xfail (visible, non bloquant)."""
    assert scraper._is_allowed("https://www.mytek.tn/smartphone.html?categoryId=82&p=2") is False
