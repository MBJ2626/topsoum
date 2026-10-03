import { describe, expect, it } from "vitest";

import { computeDiscountPercent, displayPrice, formatPrice, PRICE_PENDING_LABEL } from "./format";

// Caracterisation (2026-10-03). Intl fr-FR separe les milliers par une espace
// fine insecable (U+202F) : normalisee ici pour rester lisible.
const plain = (value: string) => value.replace(/ | /g, " ");

describe("formatPrice", () => {
  it("affiche trois decimales et la devise", () => {
    expect(plain(formatPrice(169))).toBe("169,000 TND");
    expect(plain(formatPrice(1299.9))).toBe("1 299,900 TND");
    expect(plain(formatPrice(0.5, "EUR"))).toBe("0,500 EUR");
  });
});

describe("displayPrice — regle 'Prix en cours de mise a jour'", () => {
  it("garde le libelle exact de docs/PROJET.md", () => {
    expect(PRICE_PENDING_LABEL).toBe("Prix en cours de mise à jour");
  });

  it.each([0, -1, Number.NaN])("remplace un prix %s par le libelle d'attente", (amount) => {
    expect(displayPrice(amount)).toBe(PRICE_PENDING_LABEL);
  });

  it("accepte un prix arrive en chaine depuis l'API (Decimal serialise)", () => {
    expect(displayPrice("0.000" as unknown as number)).toBe(PRICE_PENDING_LABEL);
    expect(plain(displayPrice("169.000" as unknown as number))).toBe("169,000 TND");
  });

  it("affiche normalement un prix positif, meme minuscule", () => {
    expect(plain(displayPrice(0.001))).toBe("0,001 TND");
  });
});

describe("computeDiscountPercent", () => {
  it("arrondit l'ecart sous la moyenne", () => {
    expect(computeDiscountPercent(80, 100)).toBe(20);
    expect(computeDiscountPercent(97.4, 100)).toBe(3);
  });

  it("n'affiche rien sous 1 %, au-dessus de la moyenne ou sans moyenne exploitable", () => {
    expect(computeDiscountPercent(99.6, 100)).toBeNull();
    expect(computeDiscountPercent(100, 100)).toBeNull();
    expect(computeDiscountPercent(120, 100)).toBeNull();
    expect(computeDiscountPercent(50, null)).toBeNull();
    expect(computeDiscountPercent(50, undefined)).toBeNull();
    expect(computeDiscountPercent(50, 0)).toBeNull();
  });

  it("un prix nul compte comme -100 % (pas de garde sur le prix lui-meme)", () => {
    expect(computeDiscountPercent(0, 100)).toBe(100);
  });
});
