import { describe, expect, it } from "vitest";

import { normalizeBrand, normalizeOffer } from "./normalize";
import type { RawScrapedOffer } from "./types";

describe("normalizeBrand", () => {
  it("donne une seule graphie a une marque, quelle que soit la casse du vendeur", () => {
    for (const raw of ["LESIA", "Lesia", "lesia", "  LeSiA  "]) {
      expect(normalizeBrand(raw), raw).toBe("Lesia");
    }
  });

  it("met une majuscule a chaque mot des marques composees", () => {
    expect(normalizeBrand("SMARTEC")).toBe("Smartec");
    expect(normalizeBrand("SAMSUNG  ELECTRONICS")).toBe("Samsung Electronics");
    expect(normalizeBrand("wiko-mobile")).toBe("Wiko-Mobile");
  });

  it("respecte les graphies officielles connues (sigles, casse particuliere)", () => {
    expect(normalizeBrand("hp")).toBe("HP");
    expect(normalizeBrand("Lg")).toBe("LG");
    expect(normalizeBrand("ONEPLUS")).toBe("OnePlus");
    expect(normalizeBrand("Realme")).toBe("realme");
  });

  it("retourne null pour une marque absente ou vide", () => {
    expect(normalizeBrand(null)).toBeNull();
    expect(normalizeBrand(undefined)).toBeNull();
    expect(normalizeBrand("   ")).toBeNull();
  });
});

describe("normalizeOffer", () => {
  it("normalise la marque de l'offre", () => {
    const raw: RawScrapedOffer = {
      vendor: "mytek",
      external_id: "1",
      product_name: "Smartphone LESIA YOUNG 1 2Go 16Go - Violet",
      brand: "LESIA",
      category: "smartphones",
      reference: null,
      price: 169.9,
      currency: "TND",
      stock_status: "in_stock",
      url: "https://www.mytek.tn/x.html",
      image_url: null,
      shipping_cost: null,
      scraped_at: "2026-09-28T16:32:43.840Z",
    };
    expect(normalizeOffer(raw).brand).toBe("Lesia");
  });
});
