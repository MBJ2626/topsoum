from __future__ import annotations

import json
import logging
import time
import urllib.robotparser
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from playwright.sync_api import Browser, Page, Playwright, sync_playwright
from tenacity import Retrying, before_sleep_log, stop_after_attempt, wait_exponential

logger = logging.getLogger("topsoum.scrapers")


@dataclass(frozen=True)
class ScraperConfig:
    """Reglages communs a tous les scrapers vendeurs."""

    min_delay_seconds: float = 2.0
    navigation_timeout_ms: int = 15_000
    max_attempts: int = 3
    user_agent: str = "Mozilla/5.0 (compatible; TopSoumBot/0.1; +https://topsoum.com/bot)"
    headless: bool = True


@dataclass
class ScrapeFailure:
    url: str
    reason: str
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class RateLimiter:
    """Impose un intervalle minimal entre deux requetes (1 requete / 2s par defaut)."""

    def __init__(self, min_delay_seconds: float) -> None:
        self._min_delay_seconds = min_delay_seconds
        self._last_request_at: float | None = None

    def wait(self) -> None:
        if self._last_request_at is not None:
            elapsed = time.monotonic() - self._last_request_at
            remaining = self._min_delay_seconds - elapsed
            if remaining > 0:
                time.sleep(remaining)
        self._last_request_at = time.monotonic()


class BaseScraper(ABC):
    """Classe abstraite commune a tous les scrapers vendeurs.

    Regle immuable : un scraper ne connait jamais un autre scraper. Toute la
    logique specifique a un vendeur (selectors, mapping HTML) vit sous
    vendors/{nom}/ et ne doit rien importer d'un autre dossier vendors/.
    """

    vendor: str
    base_url: str

    def __init__(self, config: ScraperConfig | None = None) -> None:
        self.config = config or ScraperConfig()
        self._logger = logging.getLogger(f"topsoum.scrapers.{self.vendor}")
        self._rate_limiter = RateLimiter(self.config.min_delay_seconds)
        self._robot_parser = self._load_robots_txt()
        self.failures: list[ScrapeFailure] = []
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None

    # -- lifecycle -------------------------------------------------------

    def __enter__(self) -> "BaseScraper":
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(headless=self.config.headless)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._browser is not None:
            self._browser.close()
        if self._playwright is not None:
            self._playwright.stop()

    # -- contrat vendeur (a implementer dans vendors/{nom}/scraper.py) --

    @abstractmethod
    def scrape_category(self, category: str, limit: int | None = None) -> list[dict[str, Any]]:
        """Scrape une categorie entiere et retourne une liste d'offres standardisees."""

    @abstractmethod
    def scrape_product(self, url: str) -> dict[str, Any] | None:
        """Scrape une fiche produit unique, retourne une offre standardisee ou None si echec."""

    # -- helpers partages --------------------------------------------------

    def new_page(self) -> Page:
        if self._browser is None:
            raise RuntimeError("BaseScraper doit etre utilise via 'with' pour ouvrir le navigateur")
        page = self._browser.new_page(user_agent=self.config.user_agent)
        page.set_default_navigation_timeout(self.config.navigation_timeout_ms)
        page.set_default_timeout(self.config.navigation_timeout_ms)
        return page

    def goto(self, page: Page, url: str) -> bool:
        """Navigue vers `url` avec respect du robots.txt, rate limiting et retry/backoff.

        Retourne False (et journalise l'echec) plutot que de lever, pour
        qu'une page en erreur n'interrompe pas tout le run.
        """
        if not self._is_allowed(url):
            self._record_failure(url, "bloque par robots.txt")
            return False

        try:
            self._goto_with_retry(page, url)
            return True
        except Exception as exc:  # noqa: BLE001 - on isole l'echec par URL
            self._record_failure(url, f"{type(exc).__name__}: {exc}")
            return False

    def dump_json(self, offers: list[dict[str, Any]], output_path: str | Path) -> Path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(offers, indent=2, ensure_ascii=False), encoding="utf-8")
        return path

    # -- internals -----------------------------------------------------

    def _goto_with_retry(self, page: Page, url: str) -> None:
        retrying = Retrying(
            stop=stop_after_attempt(self.config.max_attempts),
            wait=wait_exponential(multiplier=1, min=2, max=20),
            before_sleep=before_sleep_log(self._logger, logging.WARNING),
            reraise=True,
        )
        for attempt in retrying:
            with attempt:
                self._rate_limiter.wait()
                page.goto(url, wait_until="domcontentloaded", timeout=self.config.navigation_timeout_ms)

    def _is_allowed(self, url: str) -> bool:
        if self._robot_parser is None:
            return True
        return self._robot_parser.can_fetch(self.config.user_agent, url)

    def _load_robots_txt(self) -> urllib.robotparser.RobotFileParser | None:
        parser = urllib.robotparser.RobotFileParser()
        robots_url = urlparse(self.base_url)._replace(path="/robots.txt", query="", fragment="").geturl()
        parser.set_url(robots_url)
        try:
            parser.read()
        except OSError as exc:
            logger.warning("Impossible de lire robots.txt (%s): %s - acces autorise par defaut", robots_url, exc)
            return None
        return parser

    def _record_failure(self, url: str, reason: str) -> None:
        self.failures.append(ScrapeFailure(url=url, reason=reason))
        self._logger.error("Echec scraping %s: %s", url, reason)
