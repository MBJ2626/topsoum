import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MatchCandidate, MatchResult, MatchingEngine } from "./matching";
import { makeOffer } from "./matching/__fixtures__/realOffers";
import { loadOffers } from "./load";

const { vendorUpsert, productUpsert, productUpdate, offerUpsert, priceHistoryCreate, pendingMatchCreate } = vi.hoisted(
  () => ({
    vendorUpsert: vi.fn(),
    productUpsert: vi.fn(),
    productUpdate: vi.fn(),
    offerUpsert: vi.fn(),
    priceHistoryCreate: vi.fn(),
    pendingMatchCreate: vi.fn(),
  }),
);

vi.mock("@topsoum/db-schema", () => ({
  prisma: {
    vendor: { upsert: vendorUpsert },
    product: { upsert: productUpsert, update: productUpdate },
    offer: { upsert: offerUpsert },
    priceHistory: { create: priceHistoryCreate },
    pendingMatch: { create: pendingMatchCreate },
  },
}));

function fixedEngine(result: MatchResult): MatchingEngine {
  return { matchOffer: () => result };
}

const CANDIDATE: MatchCandidate = {
  id: "prod-existing",
  brand: "Lesia",
  model: "Young 1",
  category: "smartphones",
  canonicalName: "lesia-young-1",
  specs: { ramGb: 2, storageGb: 16, color: "blue" },
  references: [],
};

beforeEach(() => {
  vendorUpsert.mockReset().mockResolvedValue({ id: "vendor-1" });
  productUpsert.mockReset().mockResolvedValue({
    id: "prod-new",
    brand: "Lesia",
    model: "Young 1",
    category: "smartphones",
    canonicalName: "lesia-young-1-nouveau",
  });
  productUpdate.mockReset().mockResolvedValue({ id: CANDIDATE.id });
  offerUpsert.mockReset().mockResolvedValue({ id: "offer-1" });
  priceHistoryCreate.mockReset().mockResolvedValue({ id: "history-1" });
  pendingMatchCreate.mockReset().mockResolvedValue({ id: "pending-match-1" });
});

describe("loadOffers", () => {
  it("auto-accept (needsReview=false) : rattache a l'existant via product.update, pas de creation", async () => {
    const offer = makeOffer();
    const matchingEngine = fixedEngine({ candidate: CANDIDATE, confidence: 0.9, strategy: "fuzzy", needsReview: false });

    const summary = await loadOffers([offer], {
      matchingEngine,
      getCandidatesForCategory: async () => [CANDIDATE],
    });

    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: CANDIDATE.id },
      data: { imageUrl: offer.imageUrl ?? undefined },
    });
    expect(productUpsert).not.toHaveBeenCalled();
    expect(summary.productsMatched).toBe(1);
    expect(summary.productsCreated).toBe(0);
    expect(summary.productsPendingReview).toBe(0);
    expect(summary.offersUpserted).toBe(1);
    expect(summary.offersRejected).toBe(0);
  });

  it("needsReview=true : cree un nouveau produit (pas de fusion automatique) et logue un avertissement", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const offer = makeOffer();
    const matchingEngine = fixedEngine({ candidate: CANDIDATE, confidence: 0.7, strategy: "fuzzy", needsReview: true });

    const summary = await loadOffers([offer], {
      matchingEngine,
      getCandidatesForCategory: async () => [CANDIDATE],
    });

    expect(productUpdate).not.toHaveBeenCalled();
    expect(productUpsert).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[MATCHING_REVIEW]"));
    expect(summary.productsPendingReview).toBe(1);
    expect(summary.productsCreated).toBe(1);
    expect(summary.productsMatched).toBe(0);
    expect(summary.offersRejected).toBe(0);
    expect(pendingMatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vendorSlug: offer.vendor,
        externalId: offer.externalId,
        createdProductId: "prod-new",
        candidateProductId: CANDIDATE.id,
        confidence: 0.7,
        strategy: "fuzzy",
      }),
    });

    warnSpy.mockRestore();
  });

  it("aucun match : cree un nouveau produit normalement", async () => {
    const offer = makeOffer();
    const matchingEngine = fixedEngine({ candidate: null, confidence: 0, strategy: null, needsReview: false });

    const summary = await loadOffers([offer], {
      matchingEngine,
      getCandidatesForCategory: async () => [],
    });

    expect(productUpdate).not.toHaveBeenCalled();
    expect(productUpsert).toHaveBeenCalledTimes(1);
    expect(summary.productsCreated).toBe(1);
    expect(summary.productsMatched).toBe(0);
    expect(summary.productsPendingReview).toBe(0);
    expect(pendingMatchCreate).not.toHaveBeenCalled();
  });

  it("une offre qui echoue au chargement ne bloque pas le run : les suivantes sont traitees", async () => {
    const failingOffer = makeOffer({ externalId: "fail-1" });
    const okOffer = makeOffer({ externalId: "ok-1" });
    const matchingEngine = fixedEngine({ candidate: null, confidence: 0, strategy: null, needsReview: false });

    offerUpsert.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ id: "offer-ok" });

    const summary = await loadOffers([failingOffer, okOffer], {
      matchingEngine,
      getCandidatesForCategory: async () => [],
    });

    expect(summary.offersRejected).toBe(1);
    expect(summary.offersUpserted).toBe(1);
    expect(summary.productsCreated).toBe(2);
    expect(priceHistoryCreate).toHaveBeenCalledTimes(1);
  });
});
