"""Outils de test partages : faire tourner un scraper sur des fixtures HTML, hors reseau.

Ne connait aucun vendeur : chaque vendors/{nom}/tests/ passe sa classe et ses
fixtures. Aucune requete ne sort : robots.txt n'est pas telecharge, chaque
document demande est servi depuis une fixture (ou une page vide si l'URL n'a pas
de fixture) et toute autre ressource (images, CSS) est refusee.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from core.base_scraper import BaseScraper, ScrapeFailure, ScraperConfig

EMPTY_PAGE = "<!doctype html><html><body></body></html>"


@dataclass
class OfflineRun:
    result: Any
    requested_urls: list[str]
    failures: list[ScrapeFailure]


def run_offline(
    scraper_cls: type[BaseScraper],
    pages: dict[str, Path],
    action: Callable[[BaseScraper], Any],
) -> OfflineRun:
    requested_urls: list[str] = []

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(BaseScraper, "_load_robots_txt", lambda self: None)
        scraper = scraper_cls(ScraperConfig(min_delay_seconds=0, max_attempts=1))
        open_page = scraper.new_page

        def serve(route) -> None:
            request = route.request
            if request.resource_type != "document":
                route.abort()
                return
            requested_urls.append(request.url)
            fixture = pages.get(request.url)
            body = fixture.read_text(encoding="utf-8") if fixture else EMPTY_PAGE
            route.fulfill(status=200, content_type="text/html; charset=utf-8", body=body)

        def new_offline_page():
            page = open_page()
            page.route("**/*", serve)
            return page

        mp.setattr(scraper, "new_page", new_offline_page)
        with scraper:
            result = action(scraper)

    return OfflineRun(result=result, requested_urls=requested_urls, failures=scraper.failures)


@pytest.fixture(scope="session")
def scrape_offline() -> Callable[..., OfflineRun]:
    return run_offline
