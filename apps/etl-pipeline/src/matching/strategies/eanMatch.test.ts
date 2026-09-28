import { describe, expect, it } from "vitest";

import { makeCandidate, candidateYoung1Blue, candidateYoung1DarkBlue } from "../__fixtures__/candidates";
import { makeOffer, tunisianetYoung1Bleu } from "../__fixtures__/realOffers";
import { eanMatchStrategy, normalizeReference } from "./eanMatch";

describe("normalizeReference", () => {
  it("neutralise casse, accents et ponctuation", () => {
    expect(normalizeReference("LESIA-YOUNG1-BL")).toBe("lesiayoung1bl");
    expect(normalizeReference("young1-2/16-DBLUE")).toBe("young1216dblue");
  });
});

describe("eanMatchStrategy", () => {
  it("matche avec confiance 1 une reference partagee (casse/ponctuation differentes)", () => {
    const offer = makeOffer({ vendor: "spacenet", reference: "lesia young1 bl" });
    const result = eanMatchStrategy.match(offer, [candidateYoung1Blue, candidateYoung1DarkBlue]);
    expect(result).not.toBeNull();
    expect(result?.candidate.id).toBe(candidateYoung1Blue.id);
    expect(result?.confidence).toBe(1);
  });

  it("ne fait PAS collisionner les SKU vendeur reels du meme produit", () => {
    // Tunisianet et MyTek nomment le meme Young 1 avec des references differentes.
    expect(eanMatchStrategy.match(tunisianetYoung1Bleu, [candidateYoung1DarkBlue])).toBeNull();
  });

  it("retourne null sans reference", () => {
    expect(eanMatchStrategy.match(makeOffer({ reference: null }), [candidateYoung1Blue])).toBeNull();
  });

  it("retourne null pour une reference trop courte (garde anti-collision)", () => {
    const offer = makeOffer({ reference: "BL1" });
    const candidate = makeCandidate({ id: "prod-x", references: ["BL1"] });
    expect(eanMatchStrategy.match(offer, [candidate])).toBeNull();
  });

  it("accepte une reference normalisee de longueur exactement MIN_REFERENCE_LENGTH (4)", () => {
    const offer = makeOffer({ reference: "AB12" });
    const candidate = makeCandidate({ id: "prod-ref4", references: ["AB12"] });
    const result = eanMatchStrategy.match(offer, [candidate]);
    expect(result?.candidate.id).toBe("prod-ref4");
    expect(result?.confidence).toBe(1);
  });

  it("retourne null si la categorie differe", () => {
    const candidate = makeCandidate({
      id: "prod-pc",
      category: "pc-portables",
      references: ["LESIA-YOUNG1-BL"],
    });
    expect(eanMatchStrategy.match(tunisianetYoung1Bleu, [candidate])).toBeNull();
  });

  it("retourne null si deux candidats portent la meme reference (donnee incoherente)", () => {
    const duplicate = makeCandidate({ id: "prod-duplicate", references: ["LESIA-YOUNG1-BL"] });
    expect(eanMatchStrategy.match(tunisianetYoung1Bleu, [candidateYoung1Blue, duplicate])).toBeNull();
  });
});
