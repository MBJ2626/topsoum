import { describe, expect, it } from "vitest";

import { tokenSetSimilarity, tokensMatch } from "./similarity";

describe("tokensMatch", () => {
  it("accepte l'egalite stricte", () => {
    expect(tokensMatch("young", "young")).toBe(true);
    expect(tokensMatch("15", "15")).toBe(true);
  });

  it("tolere une typo sur les tokens longs (Levenshtein <= 1)", () => {
    expect(tokensMatch("samsng", "samsung")).toBe(true);
    expect(tokensMatch("iphone", "iphone")).toBe(true);
  });

  it("exige l'egalite stricte des tokens numeriques (Young 1 != Young 6)", () => {
    expect(tokensMatch("1", "6")).toBe(false);
    expect(tokensMatch("15", "16")).toBe(false);
  });

  it("n'applique pas la tolerance typo aux tokens courts", () => {
    expect(tokensMatch("gray", "grey")).toBe(false);
    expect(tokensMatch("lyra", "lyre")).toBe(false);
  });
});

describe("tokenSetSimilarity", () => {
  it("vaut 1 pour deux ensembles identiques", () => {
    expect(tokenSetSimilarity(["young", "1"], ["young", "1"])).toBe(1);
  });

  it("calcule un Dice partiel sur un sous-ensemble", () => {
    expect(tokenSetSimilarity(["iphone", "15"], ["iphone", "15", "pro"])).toBeCloseTo(0.8, 6);
  });

  it("ne rapproche pas deux numeros de modele differents", () => {
    // "young" matche mais pas "1" vs "6" : 2 x 1 / 4 = 0.5.
    expect(tokenSetSimilarity(["young", "1"], ["young", "6"])).toBeCloseTo(0.5, 6);
  });

  it("gere les ensembles vides", () => {
    expect(tokenSetSimilarity([], [])).toBe(1);
    expect(tokenSetSimilarity(["young"], [])).toBe(0);
  });
});
