import { describe, expect, it } from "vitest";

import { listVendorSlugs, parseScraperOutput } from "./runScraper";

describe("parseScraperOutput", () => {
  it("lit le nombre d'offres et d'echecs ecrits par la CLI du scraper", () => {
    expect(parseScraperOutput("274 offres collectees -> /tmp/x.json\n[...]", "2 echec(s) :\n  - url: timeout")).toEqual({
      offersCollected: 274,
      scanFailures: 2,
    });
  });

  it("retourne null / 0 si la sortie est absente", () => {
    expect(parseScraperOutput("", "Traceback ...")).toEqual({ offersCollected: null, scanFailures: 0 });
  });
});

describe("listVendorSlugs", () => {
  it("liste les dossiers vendeurs executables", () => {
    expect(listVendorSlugs()).toEqual(expect.arrayContaining(["mytek", "spacenet", "tunisianet"]));
  });
});
