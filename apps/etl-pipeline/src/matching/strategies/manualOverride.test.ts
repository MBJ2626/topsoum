import { describe, expect, it } from "vitest";

import { candidateYoung1Blue, candidateYoung6Silver4 } from "../__fixtures__/candidates";
import { makeOffer, mytekYoung6Silver, tunisianetYoung1Bleu } from "../__fixtures__/realOffers";
import { createManualOverrideStrategy } from "./manualOverride";

describe("createManualOverrideStrategy", () => {
  it("matche avec confiance 1 sur vendor + externalId", () => {
    const strategy = createManualOverrideStrategy([
      { vendor: "mytek", externalId: "62829", productId: candidateYoung6Silver4.id },
    ]);
    const result = strategy.match(mytekYoung6Silver, [candidateYoung6Silver4]);
    expect(result?.candidate.id).toBe(candidateYoung6Silver4.id);
    expect(result?.confidence).toBe(1);
  });

  it("matche sur vendor + reference, insensible a la casse", () => {
    const strategy = createManualOverrideStrategy([
      { vendor: "tunisianet", reference: "lesia-young1-bl", productId: candidateYoung1Blue.id },
    ]);
    const result = strategy.match(tunisianetYoung1Bleu, [candidateYoung1Blue]);
    expect(result?.candidate.id).toBe(candidateYoung1Blue.id);
    expect(result?.confidence).toBe(1);
  });

  it("retourne null si le produit cible n'est pas dans les candidats", () => {
    const strategy = createManualOverrideStrategy([
      { vendor: "mytek", externalId: "62829", productId: "prod-inexistant" },
    ]);
    expect(strategy.match(mytekYoung6Silver, [candidateYoung6Silver4])).toBeNull();
  });

  it("retourne null avec une table vide", () => {
    const strategy = createManualOverrideStrategy([]);
    expect(strategy.match(mytekYoung6Silver, [candidateYoung6Silver4])).toBeNull();
  });

  it("ne matche pas le meme externalId chez un autre vendeur", () => {
    const strategy = createManualOverrideStrategy([
      { vendor: "mytek", externalId: "62829", productId: candidateYoung6Silver4.id },
    ]);
    const offer = makeOffer({ vendor: "spacenet", externalId: "62829" });
    expect(strategy.match(offer, [candidateYoung6Silver4])).toBeNull();
  });
});
