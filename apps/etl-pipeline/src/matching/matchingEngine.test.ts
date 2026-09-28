import { describe, expect, it } from "vitest";

import {
  candidateIphone15Black,
  candidateIphone15ProBlack,
  candidateYoung1Blue,
  candidateYoung1Purple,
  candidateYoung6Silver4,
} from "./__fixtures__/candidates";
import {
  iphone15BlackEn,
  iphone15NoirFr,
  makeOffer,
  mytekYoung1BleuFonce,
  mytekYoung1Violet,
  mytekYoung6Silver,
  spacenetYoung1Violet,
  tunisianetYoung1Bleu,
  tunisianetYoung1Violet,
} from "./__fixtures__/realOffers";
import { createDefaultMatchingEngine, createMatchingEngine } from "./matchingEngine";
import { eanMatchStrategy } from "./strategies/eanMatch";
import { fuzzyMatchStrategy } from "./strategies/fuzzyMatch";
import type { MatchStrategy, MatchStrategyName, StrategyMatch } from "./types";

/** Strategie espionne : reponse fixe + comptage des appels. */
function spyStrategy(name: MatchStrategyName, result: StrategyMatch | null) {
  let calls = 0;
  const strategy: MatchStrategy = {
    name,
    match: () => {
      calls++;
      return result;
    },
  };
  return { strategy, callCount: () => calls };
}

const NO_MATCH = { candidate: null, confidence: 0, strategy: null, needsReview: false };

describe("createMatchingEngine — orchestration", () => {
  it("court-circuite des le hit eanMatch : les strategies suivantes ne sont pas consultees", () => {
    const fuzzySpy = spyStrategy("fuzzy", null);
    const engine = createMatchingEngine({ strategies: [eanMatchStrategy, fuzzySpy.strategy] });

    // La reference de l'offre figure dans candidateYoung1Blue.references.
    const result = engine.matchOffer(tunisianetYoung1Bleu, [candidateYoung1Blue]);
    expect(result.strategy).toBe("ean");
    expect(result.confidence).toBe(1);
    expect(result.needsReview).toBe(false);
    expect(fuzzySpy.callCount()).toBe(0);
  });

  it("bascule sur fuzzyMatch quand les references ne se recoupent pas", () => {
    const engine = createDefaultMatchingEngine();
    // Reference Spacenet LESIA-YOUNG1-PURPLE vs candidat connu via LESIA-YOUNG1-PR.
    const result = engine.matchOffer(spacenetYoung1Violet, [candidateYoung1Purple]);
    expect(result.strategy).toBe("fuzzy");
    expect(result.candidate?.id).toBe(candidateYoung1Purple.id);
    expect(result.needsReview).toBe(false);
  });

  it("laisse l'override trancher un match fuzzy en bande review", () => {
    const engine = createDefaultMatchingEngine([
      { vendor: "mytek", externalId: "62829", productId: candidateYoung6Silver4.id },
    ]);
    // fuzzy plafonne a 0.80 (RAM 2+2Go vs 4Go) -> pas d'early-exit ;
    // l'override valide par l'admin rend une confiance 1.
    const result = engine.matchOffer(mytekYoung6Silver, [candidateYoung6Silver4]);
    expect(result.strategy).toBe("manual_override");
    expect(result.confidence).toBe(1);
    expect(result.needsReview).toBe(false);
  });

  it("flague 'a valider manuellement' un match fuzzy en bande review sans override", () => {
    const engine = createDefaultMatchingEngine();
    const result = engine.matchOffer(mytekYoung6Silver, [candidateYoung6Silver4]);
    expect(result.strategy).toBe("fuzzy");
    expect(result.candidate?.id).toBe(candidateYoung6Silver4.id);
    expect(result.confidence).toBeCloseTo(0.8, 6);
    expect(result.needsReview).toBe(true);
  });

  it("retourne no-match quand toutes les strategies echouent (futur nouveau produit)", () => {
    const engine = createDefaultMatchingEngine();
    // Bleu Fonce n'existe ni en bleu ni en violet : produit a creer.
    const result = engine.matchOffer(mytekYoung1BleuFonce, [candidateYoung1Blue, candidateYoung1Purple]);
    expect(result).toEqual(NO_MATCH);
  });

  it("retourne no-match sans candidats", () => {
    const engine = createDefaultMatchingEngine();
    expect(engine.matchOffer(makeOffer(), [])).toEqual(NO_MATCH);
  });

  it("en cas d'egalite de confiance (bande review) entre deux strategies, la premiere de l'ordre l'emporte", () => {
    const candidateA = candidateYoung1Blue;
    const candidateB = candidateYoung1Purple;
    // 0.7 est entre reviewThreshold (0.6) et autoAcceptThreshold (0.85) : ni
    // early-exit, ni rejet — les deux resultats entrent en concurrence pour "best".
    const ean = spyStrategy("ean", { candidate: candidateA, confidence: 0.7 });
    const fuzzy = spyStrategy("fuzzy", { candidate: candidateB, confidence: 0.7 });
    const engine = createMatchingEngine({ strategies: [ean.strategy, fuzzy.strategy] });

    const result = engine.matchOffer(makeOffer(), [candidateA, candidateB]);
    expect(result.strategy).toBe("ean");
    expect(result.candidate?.id).toBe(candidateA.id);
    expect(result.needsReview).toBe(true);
  });

  it("respecte des seuils personnalises", () => {
    const engine = createMatchingEngine({
      strategies: [fuzzyMatchStrategy],
      autoAcceptThreshold: 0.75,
    });
    // 0.80 passe au-dessus du seuil abaisse : match automatique.
    const result = engine.matchOffer(mytekYoung6Silver, [candidateYoung6Silver4]);
    expect(result.needsReview).toBe(false);
    expect(result.confidence).toBeCloseTo(0.8, 6);
  });
});

describe("createDefaultMatchingEngine — scenario integral sur donnees reelles", () => {
  it("fait converger le Young 1 Violet des 3 vendeurs vers le meme produit", () => {
    const engine = createDefaultMatchingEngine();
    const candidates = [candidateYoung1Blue, candidateYoung1Purple];

    for (const offer of [tunisianetYoung1Violet, mytekYoung1Violet, spacenetYoung1Violet]) {
      const result = engine.matchOffer(offer, candidates);
      expect(result.candidate?.id, offer.vendor).toBe(candidateYoung1Purple.id);
      expect(result.needsReview, offer.vendor).toBe(false);
    }

    // La variante Bleu Fonce reste un produit distinct (no-match -> creation).
    expect(engine.matchOffer(mytekYoung1BleuFonce, candidates)).toEqual(NO_MATCH);
  });
});

describe("createDefaultMatchingEngine — cas reels iPhone 15 (docs/PROJET.md)", () => {
  it("rattache automatiquement Tunisianet et MyTek au meme produit malgre le nommage FR/EN", () => {
    // "iPhone 15 128Go Noir" (Tunisianet) et "iPhone 15 128 Go Black" (MyTek) :
    // meme produit, deux libelles differents.
    const engine = createDefaultMatchingEngine();
    for (const offer of [iphone15NoirFr, iphone15BlackEn]) {
      const result = engine.matchOffer(offer, [candidateIphone15Black]);
      expect(result.candidate?.id, offer.productName).toBe(candidateIphone15Black.id);
      expect(result.strategy, offer.productName).toBe("fuzzy");
      expect(result.needsReview, offer.productName).toBe(false);
    }
  });

  it("ne confond jamais iPhone 15 et iPhone 15 Pro : gammes distinctes", () => {
    const engine = createDefaultMatchingEngine();
    // Seul le candidat Pro est connu : aucun match, pas meme "a valider".
    expect(engine.matchOffer(iphone15NoirFr, [candidateIphone15ProBlack])).toEqual(NO_MATCH);
    expect(engine.matchOffer(iphone15BlackEn, [candidateIphone15ProBlack])).toEqual(NO_MATCH);
  });

  it("choisit le bon candidat quand iPhone 15 et iPhone 15 Pro coexistent", () => {
    const engine = createDefaultMatchingEngine();
    const candidates = [candidateIphone15Black, candidateIphone15ProBlack];
    const result = engine.matchOffer(iphone15NoirFr, candidates);
    expect(result.candidate?.id).toBe(candidateIphone15Black.id);
  });
});
