"""CLI : uv run python -m vendors.mytek --category smartphones --limit 8"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from core.base_scraper import ScraperConfig
from vendors.mytek.scraper import MytekScraper


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scraper MyTek -> JSON d'offres standardisees")
    parser.add_argument("--category", default="smartphones")
    parser.add_argument("--limit", type=int, default=None, help="Nombre max d'offres a collecter")
    parser.add_argument("--output", default=None, help="Chemin du fichier JSON de sortie")
    parser.add_argument("--headed", action="store_true", help="Lance le navigateur en mode visible")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    config = ScraperConfig(headless=not args.headed)
    with MytekScraper(config=config) as scraper:
        offers = scraper.scrape_category(args.category, limit=args.limit)

        output_path = args.output or f"output/mytek-{args.category}.json"
        scraper.dump_json(offers, output_path)

        print(f"{len(offers)} offres collectees -> {Path(output_path).resolve()}")
        if scraper.failures:
            print(f"{len(scraper.failures)} echec(s) :", file=sys.stderr)
            for failure in scraper.failures:
                print(f"  - {failure.url}: {failure.reason}", file=sys.stderr)

        print(json.dumps(offers[:3], indent=2, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
