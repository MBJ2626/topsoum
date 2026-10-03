import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultMatchingEngine, type MatchCandidate } from "./matching";
import * as real from "./matching/__fixtures__/realOffers";
import { loadOffers } from "./load";

/**
 * Tests de caracterisation : regroupement cross-site de bout en bout dans
 * loadOffers, avec le VRAI moteur de matching (load.test.ts le remplace par un
 * moteur fige). Ils figent le comportement observe le 2026-10-03 sur un catalogue
 * vide : le premier vendeur cree le produit, le cache de candidats du run
 * permet aux vendeurs suivants de s'y rattacher. Un echec ici signale un
 * changement de regroupement, voulu ou non.
 */

interface StoredProduct {
  id: string;
  brand: string;
  model: string;
  category: string;
  canonicalName: string;
}

const db = vi.hoisted(() => ({
  products: new Map<string, StoredProduct>(),
  /** productId de chaque offre chargee, dans l'ordre de chargement. */
  offerProductIds: [] as string[],
  pendingMatches: [] as { externalId: string; createdProductId: string; candidateProductId: string }[],
}));

vi.mock("@topsoum/db-schema", () => ({
  prisma: {
    vendor: { upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({ id: `vendor-${where.name}` })) },
    product: {
      upsert: vi.fn(async ({ where, create }: { where: { canonicalName: string }; create: Omit<StoredProduct, "id"> }) => {
        const existing = db.products.get(where.canonicalName);
        if (existing) return existing;
        const created = { id: `prod-${where.canonicalName}`, ...create };
        db.products.set(where.canonicalName, created);
        return created;
      }),
      update: vi.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
    },
    offer: {
      upsert: vi.fn(async ({ where }: { where: { productId_vendorId: { productId: string } } }) => {
        db.offerProductIds.push(where.productId_vendorId.productId);
        return { id: `offer-${db.offerProductIds.length}` };
      }),
    },
    priceHistory: { createMany: vi.fn(async () => ({ count: 1 })) },
    pendingMatch: {
      createMany: vi.fn(
        async ({ data }: { data: { externalId: string; createdProductId: string; candidateProductId: string }[] }) => {
          db.pendingMatches.push(...data);
          return { count: data.length };
        },
      ),
    },
  },
}));

beforeEach(() => {
  db.products.clear();
  db.offerProductIds.length = 0;
  db.pendingMatches.length = 0;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

async function loadWithRealEngine(offers: Parameters<typeof loadOffers>[0], existing: MatchCandidate[] = []) {
  const summary = await loadOffers(offers, {
    matchingEngine: createDefaultMatchingEngine(),
    getCandidatesForCategory: async () => [...existing],
  });
  return { summary, productIds: [...db.offerProductIds] };
}

describe("loadOffers + vrai moteur — regroupement cross-site sur catalogue vide", () => {
  it("Young 1 Violet : Tunisianet cree le produit, MyTek et Spacenet s'y rattachent", async () => {
    const { summary, productIds } = await loadWithRealEngine([
      real.tunisianetYoung1Violet,
      real.mytekYoung1Violet,
      real.spacenetYoung1Violet,
    ]);

    expect(productIds).toEqual(["prod-lesia-lesia-young1-pr", "prod-lesia-lesia-young1-pr", "prod-lesia-lesia-young1-pr"]);
    expect(summary).toMatchObject({ productsCreated: 1, productsMatched: 2, productsPendingReview: 0, offersRejected: 0 });
  });

  it("iPhone 15 : '128Go Noir' (Tunisianet) et '128 Go Black' (MyTek) donnent un seul produit", async () => {
    const { summary, productIds } = await loadWithRealEngine([real.iphone15NoirFr, real.iphone15BlackEn]);

    expect(productIds).toEqual(["prod-apple-iphone-15-128go-noir", "prod-apple-iphone-15-128go-noir"]);
    expect(summary).toMatchObject({ productsCreated: 1, productsMatched: 1, productsPendingReview: 0 });
  });

  it("Young 6 : trois fiches distinctes, une seule suggestion 'a valider' (Spacenet proche de Tunisianet)", async () => {
    const { summary, productIds } = await loadWithRealEngine([
      real.tunisianetYoung6Noir,
      real.mytekYoung6Silver,
      real.spacenetYoung6Noir,
    ]);

    expect(productIds).toEqual([
      "prod-lesia-lesia-young6-bk",
      "prod-lesia-young6-2-16-silver",
      "prod-lesia-lesia-young6-noir",
    ]);
    expect(summary).toMatchObject({ productsCreated: 3, productsMatched: 0, productsPendingReview: 1 });
    expect(db.pendingMatches).toEqual([
      expect.objectContaining({
        externalId: real.spacenetYoung6Noir.externalId,
        createdProductId: "prod-lesia-lesia-young6-noir",
      }),
    ]);
  });

  it("variantes de bleu (Bleu, Bleu Fonce, Bleu Ciel) : jamais fusionnees", async () => {
    const { summary, productIds } = await loadWithRealEngine([
      real.tunisianetYoung1Bleu,
      real.mytekYoung1BleuFonce,
      real.mytekYoung1BleuCiel,
    ]);

    expect(new Set(productIds).size).toBe(3);
    expect(summary).toMatchObject({ productsCreated: 3, productsMatched: 0, productsPendingReview: 0 });
  });

  it("Young 2 : 'Bleu Nuit 4Go' et 'Dark Bleu 2Go' restent deux produits sans suggestion", async () => {
    const { summary, productIds } = await loadWithRealEngine([real.tunisianetYoung2BleuNuit, real.spacenetYoung2DarkBleu]);

    expect(new Set(productIds).size).toBe(2);
    expect(summary).toMatchObject({ productsCreated: 2, productsMatched: 0, productsPendingReview: 0 });
  });

  it("l'ordre de chargement change la fiche creee, pas le regroupement (Spacenet en premier)", async () => {
    const { productIds } = await loadWithRealEngine([
      real.spacenetYoung1Violet,
      real.tunisianetYoung1Violet,
      real.mytekYoung1Violet,
    ]);

    expect(productIds).toEqual([
      "prod-lesia-lesia-young1-purple",
      "prod-lesia-lesia-young1-purple",
      "prod-lesia-lesia-young1-purple",
    ]);
  });
});
