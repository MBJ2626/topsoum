import type { ScrapedOffer } from "@topsoum/shared-types";

/**
 * Offres reelles recopiees des sorties de scrapers (apps/scrapers/output/*.json),
 * noms et references verbatim. Le meme produit Lesia est nomme differemment
 * chez Tunisianet (pipes), MyTek (casse, tirets) et Spacenet (espaces).
 */

export function makeOffer(partial: Partial<ScrapedOffer> = {}): ScrapedOffer {
  return {
    vendor: "tunisianet",
    externalId: "0",
    productName: "Produit test",
    brand: null,
    category: "smartphones",
    reference: null,
    price: 100,
    currency: "TND",
    stockStatus: "in_stock",
    url: "https://example.tn/produit-test",
    imageUrl: null,
    shippingCost: null,
    scrapedAt: "2026-07-15T10:00:00+00:00",
    ...partial,
  };
}

// --- Lesia Young 1 (2Go / 16Go) ---

export const tunisianetYoung1Bleu = makeOffer({
  vendor: "tunisianet",
  externalId: "91033",
  productName: "Smartphone Lesia Young 1 | 2Go / 16Go | Bleu",
  brand: "Lesia",
  reference: "LESIA-YOUNG1-BL",
  price: 169.0,
});

export const tunisianetYoung1Violet = makeOffer({
  vendor: "tunisianet",
  externalId: "97350",
  productName: "Smartphone Lesia Young 1 | 2Go / 16Go | Violet",
  brand: "Lesia",
  reference: "LESIA-YOUNG1-PR",
  price: 169.0,
});

export const mytekYoung1BleuFonce = makeOffer({
  vendor: "mytek",
  externalId: "67114",
  productName: "Smartphone LESIA YOUNG 1 2Go 16Go - Bleu Foncé",
  brand: "LESIA",
  reference: "YOUNG1-2/16-DBLUE",
  price: 169.9,
});

export const mytekYoung1Violet = makeOffer({
  vendor: "mytek",
  externalId: "72846",
  productName: "Smartphone LESIA YOUNG 1 2Go 16Go - Violet",
  brand: "LESIA",
  reference: "YOUNG1-2/16-PURPLE",
  price: 169.9,
});

export const mytekYoung1BleuCiel = makeOffer({
  vendor: "mytek",
  externalId: "72847",
  productName: "Smartphone LESIA YOUNG 1 2Go 16Go - Bleu Ciel",
  brand: "LESIA",
  reference: "YOUNG1-2/16-SBLUE",
  price: 169.9,
});

export const spacenetYoung1Violet = makeOffer({
  vendor: "spacenet",
  externalId: "99068",
  productName: "Smartphone Lesia Young 1 2Go 16Go Violet",
  brand: "Lesia",
  reference: "LESIA-YOUNG1-PURPLE",
  price: 169.9,
});

// --- Lesia Young 6 (RAM divergente selon le vendeur : 4Go, 2+2Go, 2Go) ---

export const tunisianetYoung6Noir = makeOffer({
  vendor: "tunisianet",
  externalId: "88987",
  productName: "Smartphone Lesia Young 6 4Go /16Go / Noir",
  brand: "Lesia",
  reference: "LESIA-YOUNG6-BK",
  price: 189.0,
});

export const mytekYoung6Silver = makeOffer({
  vendor: "mytek",
  externalId: "62829",
  productName: "Smartphone Lesia Young 6 2 + 2Go 16Go - Silver",
  brand: "LESIA",
  reference: "YOUNG6-2/16-SILVER",
  price: 189.9,
});

export const spacenetYoung6Noir = makeOffer({
  vendor: "spacenet",
  externalId: "82614",
  productName: "Smartphone Lesia Young 6 2Go 16Go Noir",
  brand: "Lesia",
  reference: "LESIA-YOUNG6/NOIR",
  price: 179.0,
});

// --- Autres cas reels ---

export const tunisianetLogicomLyra = makeOffer({
  vendor: "tunisianet",
  externalId: "91038",
  productName: "Téléphone Portable LOGICOM LYRA | 2+2Go / 32Go | Noir",
  brand: "LOGICOM",
  reference: "LOG-LYRA-32G-BK",
  price: 199.0,
});

export const tunisianetYoung2BleuNuit = makeOffer({
  vendor: "tunisianet",
  externalId: "88990",
  productName: "Smartphone Lesia Young 2 4Go 32Go  -BLEU NUIT",
  brand: "Lesia",
  reference: "LESIA-YOUNG2-BL",
  price: 209.0,
});

export const spacenetYoung2DarkBleu = makeOffer({
  vendor: "spacenet",
  externalId: "82834",
  productName: "Smartphone Lesia Young 2 2Go 32Go Dark Bleu",
  brand: "Lesia",
  reference: "LESIA-YOUNG2/DBL",
  price: 209.9,
});

// --- Cas canonique docs/PROJET.md : FR vs EN ---

export const iphone15NoirFr = makeOffer({
  vendor: "tunisianet",
  externalId: "iphone-fr",
  productName: "iPhone 15 128Go Noir",
  brand: "Apple",
  price: 3899.0,
});

export const iphone15BlackEn = makeOffer({
  vendor: "mytek",
  externalId: "iphone-en",
  productName: "iPhone 15 128 Go Black",
  brand: "Apple",
  price: 3949.0,
});
