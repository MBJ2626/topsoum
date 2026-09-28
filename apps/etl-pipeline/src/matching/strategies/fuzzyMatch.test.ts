import { describe, expect, it } from "vitest";

import {
  candidateIphone15Black,
  candidateIphone15ProBlack,
  candidateLyra,
  candidateYoung1Blue,
  candidateYoung1DarkBlue,
  candidateYoung1Purple,
  candidateYoung1SkyBlue,
  candidateYoung6Black4,
  candidateYoung6Silver2p2,
  candidateYoung6Silver4,
  makeCandidate,
} from "../__fixtures__/candidates";
import {
  iphone15BlackEn,
  iphone15NoirFr,
  makeOffer,
  mytekYoung1Violet,
  mytekYoung6Silver,
  spacenetYoung1Violet,
  spacenetYoung6Noir,
  tunisianetLogicomLyra,
  tunisianetYoung1Bleu,
  tunisianetYoung1Violet,
} from "../__fixtures__/realOffers";
import { fuzzyMatchStrategy } from "./fuzzyMatch";

const allYoung1Candidates = [
  candidateYoung1Blue,
  candidateYoung1DarkBlue,
  candidateYoung1SkyBlue,
  candidateYoung1Purple,
];

describe("fuzzyMatchStrategy — matchs positifs cross-vendeur", () => {
  it("rattache le meme Young 1 Violet malgre pipes, casse et separateurs differents", () => {
    // Le meme produit chez les 3 vendeurs, avec 3 nommages differents.
    for (const offer of [tunisianetYoung1Violet, mytekYoung1Violet, spacenetYoung1Violet]) {
      const result = fuzzyMatchStrategy.match(offer, allYoung1Candidates);
      expect(result?.candidate.id, offer.vendor).toBe(candidateYoung1Purple.id);
      expect(result?.confidence, offer.vendor).toBeGreaterThanOrEqual(0.85);
    }
  });

  it("rattache le Young 1 Bleu Tunisianet au bon candidat parmi les variantes bleues", () => {
    const result = fuzzyMatchStrategy.match(tunisianetYoung1Bleu, allYoung1Candidates);
    expect(result?.candidate.id).toBe(candidateYoung1Blue.id);
    expect(result?.confidence).toBeCloseTo(1, 6);
  });

  it("matche le cas canonique PROJET.md : iPhone 15 128Go Noir vs 128 Go Black", () => {
    // Le candidat a des specs vides : exerce aussi le repli parseSpecs(canonicalName).
    for (const offer of [iphone15NoirFr, iphone15BlackEn]) {
      const result = fuzzyMatchStrategy.match(offer, [candidateIphone15Black]);
      expect(result?.candidate.id, offer.productName).toBe(candidateIphone15Black.id);
      // brand 0.15 + modele 0.45 + stockage 0.15 + RAM inconnue 0.0625 + couleur 0.125.
      expect(result?.confidence, offer.productName).toBeCloseTo(0.9375, 6);
    }
  });

  it("matche le Logicom Lyra avec RAM etendue identique (2+2Go)", () => {
    const result = fuzzyMatchStrategy.match(tunisianetLogicomLyra, [candidateLyra]);
    expect(result?.candidate.id).toBe(candidateLyra.id);
    expect(result?.confidence).toBeCloseTo(1, 6);
  });
});

describe("fuzzyMatchStrategy — resolveCandidateSpecs (repli canonicalName)", () => {
  it("utilise les specs propres du candidat quand seule la couleur est renseignee, sans repli sur canonicalName", () => {
    // canonicalName parserait "bleu" (blue) si le repli se declenchait a tort :
    // specs.color="black" doit l'emporter des lors qu'UN SEUL champ specs est connu.
    const candidate = makeCandidate({
      id: "prod-partial-specs",
      brand: "Apple",
      model: "iPhone 15",
      canonicalName: "apple-iphone-15-128go-bleu",
      specs: { color: "black" },
    });
    const result = fuzzyMatchStrategy.match(iphone15NoirFr, [candidate]);
    // Si le repli canonicalName s'appliquait a tort, la couleur "blue" du
    // candidat s'opposerait au "black" de l'offre : veto -> null.
    expect(result).not.toBeNull();
    expect(result?.candidate.id).toBe("prod-partial-specs");
    // brand 0.15 + modele 0.45 + stockage inconnu 0.075 + RAM inconnue 0.0625 + couleur 0.125.
    expect(result?.confidence).toBeCloseTo(0.8625, 6);
  });
});

describe("fuzzyMatchStrategy — AMBIGUITY_MARGIN (bande 'a valider')", () => {
  const ambiguityOffer = makeOffer({ productName: "X1 4Go 64Go Noir", brand: "Zeta" });

  it("plafonne a 0.75 quand le deuxieme candidat est exactement a la marge (0.05)", () => {
    const best = makeCandidate({
      id: "prod-ambiguity-best",
      brand: "Zeta",
      model: "X1",
      specs: { ramGb: 4, extendedRamGb: 2, storageGb: 64, color: "black" },
    });
    const atMargin = makeCandidate({
      id: "prod-ambiguity-at-margin",
      brand: "Zeta",
      model: "X1",
      specs: { ramGb: 2, extendedRamGb: 2, color: "black" },
    });
    const result = fuzzyMatchStrategy.match(ambiguityOffer, [best, atMargin]);
    expect(result?.candidate.id).toBe("prod-ambiguity-best");
    expect(result?.confidence).toBeCloseTo(0.75, 6);
  });

  it("ne plafonne pas quand l'ecart avec le deuxieme candidat depasse la marge", () => {
    const best = makeCandidate({
      id: "prod-ambiguity-best-2",
      brand: "Zeta",
      model: "X1",
      specs: { ramGb: 4, storageGb: 64, color: "black" },
    });
    const farBehind = makeCandidate({
      id: "prod-ambiguity-far",
      brand: "Zeta",
      model: "X1",
      specs: { color: "black" },
    });
    const result = fuzzyMatchStrategy.match(ambiguityOffer, [best, farBehind]);
    expect(result?.candidate.id).toBe("prod-ambiguity-best-2");
    expect(result?.confidence).toBeCloseTo(1, 6);
  });
});

describe("fuzzyMatchStrategy — vetos (contraintes dures)", () => {
  it("ne matche pas Bleu contre les variantes Bleu Fonce ou Bleu Ciel", () => {
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [candidateYoung1DarkBlue])).toBeNull();
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [candidateYoung1SkyBlue])).toBeNull();
  });

  it("ne matche jamais deux numeros de modele differents (Young 1 vs Young 6)", () => {
    const young6Blue = makeCandidate({
      id: "prod-young6-blue",
      model: "Young 6",
      specs: { ramGb: 2, storageGb: 16, color: "blue" },
    });
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [young6Blue])).toBeNull();
  });

  it("ne matche pas deux marques differentes", () => {
    const samsungClone = makeCandidate({
      id: "prod-samsung",
      brand: "Samsung",
      specs: { ramGb: 2, storageGb: 16, color: "blue" },
    });
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [samsungClone])).toBeNull();
  });

  it("ne matche pas deux stockages differents", () => {
    const young1Blue32 = makeCandidate({
      id: "prod-young1-blue-32",
      specs: { ramGb: 2, storageGb: 32, color: "blue" },
    });
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [young1Blue32])).toBeNull();
  });

  it("ne matche jamais deux gammes distinctes (iPhone 15 vs iPhone 15 Pro)", () => {
    // Puce, appareil photo, prix differents : ce n'est pas une variation de
    // nommage, ce sont deux produits distincts, pas seulement "a valider".
    expect(fuzzyMatchStrategy.match(iphone15NoirFr, [candidateIphone15ProBlack])).toBeNull();
    expect(fuzzyMatchStrategy.match(iphone15BlackEn, [candidateIphone15ProBlack])).toBeNull();
  });

  it("ignore les candidats d'une autre categorie", () => {
    const pcCandidate = makeCandidate({
      id: "prod-pc",
      category: "pc-portables",
      specs: { ramGb: 2, storageGb: 16, color: "blue" },
    });
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [pcCandidate])).toBeNull();
  });

  it("retourne null sans candidats", () => {
    expect(fuzzyMatchStrategy.match(tunisianetYoung1Bleu, [])).toBeNull();
  });
});

describe("fuzzyMatchStrategy — bande 'a valider manuellement' (plafonds)", () => {
  it("envoie en validation (0.65) une RAM contradictoire, tout le reste identique (2Go vs 4Go)", () => {
    // Meme Young 6 Noir : Spacenet annonce 2Go (RAM physique), Tunisianet 4Go
    // (physique + virtuelle). Ni fusion automatique, ni doublon silencieux.
    const result = fuzzyMatchStrategy.match(spacenetYoung6Noir, [candidateYoung6Black4]);
    expect(result?.candidate.id).toBe(candidateYoung6Black4.id);
    expect(result?.confidence).toBeCloseTo(0.65, 6);
  });

  it("prefere la variante RAM exacte a une variante RAM contradictoire", () => {
    const young6Black2 = makeCandidate({
      id: "prod-young6-black-2",
      model: "Young 6",
      specs: { ramGb: 2, storageGb: 16, color: "black" },
    });
    const result = fuzzyMatchStrategy.match(spacenetYoung6Noir, [candidateYoung6Black4, young6Black2]);
    expect(result?.candidate.id).toBe("prod-young6-black-2");
    expect(result?.confidence).toBeCloseTo(1, 6);
  });

  it("plafonne a 0.80 une RAM compatible mais non identique (2+2Go vs 4Go)", () => {
    const result = fuzzyMatchStrategy.match(mytekYoung6Silver, [candidateYoung6Silver4]);
    expect(result?.candidate.id).toBe(candidateYoung6Silver4.id);
    expect(result?.confidence).toBeCloseTo(0.8, 6);
    expect(result!.confidence).toBeLessThan(0.85);
    expect(result!.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("plafonne a 0.75 deux candidats trop proches (ambiguite a trancher par l'admin)", () => {
    const result = fuzzyMatchStrategy.match(mytekYoung6Silver, [
      candidateYoung6Silver4,
      candidateYoung6Silver2p2,
    ]);
    expect(result?.candidate.id).toBe(candidateYoung6Silver2p2.id);
    expect(result?.confidence).toBeCloseTo(0.75, 6);
  });

  it("plafonne a 0.80 un token modele en trop non distinctif (ex: annotation reseau)", () => {
    // "5G" n'est pas un suffixe de gamme comme "Pro" : variation de nommage
    // plausible, a laisser trancher par l'admin plutot que rejeter d'office.
    const offer = makeOffer({
      productName: "Smartphone Xiaomi Redmi 13 5G 128Go Noir",
      brand: "Xiaomi",
    });
    const candidate = makeCandidate({
      id: "prod-redmi-13",
      brand: "Xiaomi",
      model: "Redmi 13",
      specs: { storageGb: 128, color: "black" },
    });
    const result = fuzzyMatchStrategy.match(offer, [candidate]);
    expect(result?.candidate.id).toBe("prod-redmi-13");
    expect(result?.confidence).toBeCloseTo(0.8, 6);
    expect(result!.confidence).toBeLessThan(0.85);
    expect(result!.confidence).toBeGreaterThanOrEqual(0.6);
  });
});
