import type { MatchCandidate } from "../types";

/**
 * Produits candidats canoniques (deja en base) utilises par les tests.
 * Les references portees correspondent au premier vendeur qui a cree le produit.
 */

export function makeCandidate(partial: Partial<MatchCandidate> & { id: string }): MatchCandidate {
  return {
    brand: "Lesia",
    model: "Young 1",
    category: "smartphones",
    canonicalName: "",
    specs: {},
    references: [],
    ...partial,
  };
}

export const candidateYoung1Blue = makeCandidate({
  id: "prod-young1-blue",
  canonicalName: "lesia-young-1-2go-16go-bleu",
  specs: { ramGb: 2, storageGb: 16, color: "blue" },
  references: ["LESIA-YOUNG1-BL"],
});

export const candidateYoung1DarkBlue = makeCandidate({
  id: "prod-young1-dark-blue",
  canonicalName: "lesia-young-1-2go-16go-bleu-fonce",
  specs: { ramGb: 2, storageGb: 16, color: "dark-blue" },
  references: ["YOUNG1-2/16-DBLUE"],
});

export const candidateYoung1SkyBlue = makeCandidate({
  id: "prod-young1-sky-blue",
  canonicalName: "lesia-young-1-2go-16go-bleu-ciel",
  specs: { ramGb: 2, storageGb: 16, color: "sky-blue" },
  references: ["LESIA-YOUNG1-SKYBLUE"],
});

export const candidateYoung1Purple = makeCandidate({
  id: "prod-young1-purple",
  canonicalName: "lesia-young-1-2go-16go-violet",
  specs: { ramGb: 2, storageGb: 16, color: "purple" },
  references: ["LESIA-YOUNG1-PR"],
});

export const candidateYoung6Black4 = makeCandidate({
  id: "prod-young6-black-4-16",
  model: "Young 6",
  canonicalName: "lesia-young-6-4go-16go-noir",
  specs: { ramGb: 4, storageGb: 16, color: "black" },
  references: ["LESIA-YOUNG6-BK"],
});

export const candidateYoung6Silver4 = makeCandidate({
  id: "prod-young6-silver-4-16",
  model: "Young 6",
  canonicalName: "lesia-young-6-4go-16go-silver",
  specs: { ramGb: 4, storageGb: 16, color: "silver" },
  references: ["LESIA-YOUNG6-SL"],
});

export const candidateYoung6Silver2p2 = makeCandidate({
  id: "prod-young6-silver-2p2-16",
  model: "Young 6",
  canonicalName: "lesia-young-6-2-2go-16go-silver",
  specs: { ramGb: 2, extendedRamGb: 2, storageGb: 16, color: "silver" },
  references: ["YOUNG6-2/16-SILVER"],
});

export const candidateLyra = makeCandidate({
  id: "prod-logicom-lyra-black",
  brand: "Logicom",
  model: "Lyra",
  canonicalName: "logicom-lyra-2-2go-32go-noir",
  specs: { ramGb: 2, extendedRamGb: 2, storageGb: 32, color: "black" },
  references: ["LOG-LYRA-32G-BK"],
});

/** Specs vides + canonicalName parsable : exerce le repli parseSpecs(canonicalName). */
export const candidateIphone15Black = makeCandidate({
  id: "prod-iphone15-black-128",
  brand: "Apple",
  model: "iPhone 15",
  canonicalName: "apple-iphone-15-128go-noir",
  specs: {},
  references: [],
});

export const candidateIphone15ProBlack = makeCandidate({
  id: "prod-iphone15-pro-black-128",
  brand: "Apple",
  model: "iPhone 15 Pro",
  canonicalName: "apple-iphone-15-pro-128go-noir",
  specs: { storageGb: 128, color: "black" },
  references: [],
});
