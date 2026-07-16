import { prisma } from "@topsoum/db-schema";
import type { ScrapedOffer } from "@topsoum/shared-types";

import { canonicalNameFor, VENDOR_DISPLAY_NAMES } from "./normalize";
import {
  createDefaultMatchingEngine,
  parseSpecs,
  type CandidateSpecs,
  type MatchCandidate,
  type MatchingEngine,
} from "./matching";

export interface LoadSummary {
  vendorsUpserted: number;
  productsCreated: number;
  /** Offre rattachee a un Product existant (ean/fuzzy/manual_override, needsReview=false). */
  productsMatched: number;
  /**
   * Match plausible mais pas certain (needsReview=true) : par prudence, un
   * nouveau produit est cree quand meme plutot que fusionne (cf.
   * docs/PROJET.md 9.2, ne jamais fusionner a l'aveugle). Compteur separe
   * en attendant la vraie file de validation admin (Etape 7).
   */
  productsPendingReview: number;
  offersUpserted: number;
  priceHistoryInserted: number;
  /** Offre dont le chargement a leve une exception : comptee, mais le run continue. */
  offersRejected: number;
}

export interface LoadDeps {
  matchingEngine: MatchingEngine;
  getCandidatesForCategory: (category: string) => Promise<MatchCandidate[]>;
}

/** Vendor.id par vendeur (slug scraper), en cache pour tout le process. */
export async function resolveVendor(vendorSlug: string, cache: Map<string, string>): Promise<string> {
  const cached = cache.get(vendorSlug);
  if (cached) return cached;

  const vendorName = VENDOR_DISPLAY_NAMES[vendorSlug] ?? vendorSlug;
  const vendor = await prisma.vendor.upsert({
    where: { name: vendorName },
    create: { name: vendorName },
    update: {},
  });
  cache.set(vendorSlug, vendor.id);
  return vendor.id;
}

async function getCandidatesForCategoryFromDb(category: string): Promise<MatchCandidate[]> {
  const products = await prisma.product.findMany({ where: { category } });
  return products.map((product) => ({
    id: product.id,
    brand: product.brand,
    model: product.model,
    category: product.category,
    canonicalName: product.canonicalName,
    specs: (product.specs ?? {}) as CandidateSpecs,
    // Aucun scraper ne capture d'EAN aujourd'hui (offer.reference est un SKU
    // propre a chaque vendeur) et aucune colonne ne les persiste encore :
    // la strategie ean ne peut donc pas matcher en V1, ce qui reflete la
    // realite des donnees plutot qu'une regression.
    references: [],
  }));
}

/**
 * Charge des offres normalisees en DB : Vendor -> Product -> Offer -> PriceHistory.
 * Le regroupement cross-vendeur passe par le Matching Engine (Etape 4,
 * matching/matchingEngine.ts) : chaque offre est comparee aux Product deja
 * en base pour la meme categorie avant de creer un nouveau produit.
 */
export async function loadOffers(offers: ScrapedOffer[], deps: Partial<LoadDeps> = {}): Promise<LoadSummary> {
  const matchingEngine = deps.matchingEngine ?? createDefaultMatchingEngine();
  const getCandidatesForCategory = deps.getCandidatesForCategory ?? getCandidatesForCategoryFromDb;

  const summary: LoadSummary = {
    vendorsUpserted: 0,
    productsCreated: 0,
    productsMatched: 0,
    productsPendingReview: 0,
    offersUpserted: 0,
    priceHistoryInserted: 0,
    offersRejected: 0,
  };

  const vendorIdCache = new Map<string, string>();
  const candidatesByCategory = new Map<string, MatchCandidate[]>();

  for (const offer of offers) {
    try {
      const vendorCountBefore = vendorIdCache.size;
      const vendorId = await resolveVendor(offer.vendor, vendorIdCache);
      if (vendorIdCache.size > vendorCountBefore) summary.vendorsUpserted += 1;

      let candidates = candidatesByCategory.get(offer.category);
      if (!candidates) {
        candidates = await getCandidatesForCategory(offer.category);
        candidatesByCategory.set(offer.category, candidates);
      }

      const matchResult = matchingEngine.matchOffer(offer, candidates);

      let productId: string;
      if (matchResult.candidate && !matchResult.needsReview) {
        // Auto-accept (confiance >= 0.85) : rattache a l'existant, ne fusionne jamais a l'aveugle.
        const updated = await prisma.product.update({
          where: { id: matchResult.candidate.id },
          data: { imageUrl: offer.imageUrl ?? undefined },
        });
        productId = updated.id;
        summary.productsMatched += 1;
      } else {
        if (matchResult.candidate && matchResult.needsReview) {
          // Bande [0.6, 0.85) : match plausible mais pas certain. Pas de
          // fusion automatique (risque de melanger deux variantes distinctes,
          // cf. docs/PROJET.md 9.2). On cree un nouveau produit et on logue,
          // en attendant une vraie file de validation (Etape 7).
          console.warn(
            `[MATCHING_REVIEW] ${offer.vendor}:${offer.externalId} proche de ${matchResult.candidate.id} ` +
              `(confiance ${matchResult.confidence.toFixed(2)}, strategie ${matchResult.strategy})`,
          );
          summary.productsPendingReview += 1;
        }

        const canonicalName = canonicalNameFor(offer);
        const specs = parseSpecs(offer.productName);
        const created = await prisma.product.upsert({
          where: { canonicalName },
          create: {
            canonicalName,
            brand: offer.brand ?? "Generique",
            model: offer.productName,
            category: offer.category,
            imageUrl: offer.imageUrl,
            specs: {
              ramGb: specs.ramGb,
              extendedRamGb: specs.extendedRamGb,
              storageGb: specs.storageGb,
              color: specs.color,
            },
          },
          update: {
            imageUrl: offer.imageUrl ?? undefined,
          },
        });
        productId = created.id;
        summary.productsCreated += 1;

        // Garde le cache in-run coherent : les offres suivantes de cette
        // categorie doivent pouvoir matcher ce produit qu'on vient de creer.
        candidates.push({
          id: created.id,
          brand: created.brand,
          model: created.model,
          category: created.category,
          canonicalName: created.canonicalName,
          specs: { ramGb: specs.ramGb, extendedRamGb: specs.extendedRamGb, storageGb: specs.storageGb, color: specs.color },
          references: [],
        });
      }

      const savedOffer = await prisma.offer.upsert({
        where: { productId_vendorId: { productId, vendorId } },
        create: {
          productId,
          vendorId,
          price: offer.price.toFixed(3),
          stockStatus: offer.stockStatus,
          url: offer.url,
          shippingCost: offer.shippingCost !== null ? offer.shippingCost.toFixed(3) : null,
          scrapedAt: new Date(offer.scrapedAt),
        },
        update: {
          price: offer.price.toFixed(3),
          stockStatus: offer.stockStatus,
          url: offer.url,
          shippingCost: offer.shippingCost !== null ? offer.shippingCost.toFixed(3) : null,
          scrapedAt: new Date(offer.scrapedAt),
        },
      });
      summary.offersUpserted += 1;

      await prisma.priceHistory.create({
        data: {
          offerId: savedOffer.id,
          price: offer.price.toFixed(3),
          recordedAt: new Date(offer.scrapedAt),
        },
      });
      summary.priceHistoryInserted += 1;
    } catch (error) {
      // Ne relance pas : necessaire pour que ScraperRun.errorCount reflete
      // la realite sans tuer tout le run pour une seule offre en echec.
      summary.offersRejected += 1;
      console.error(`Offre rejetee pendant le chargement (${offer.vendor}:${offer.externalId}): ${(error as Error).message}`);
    }
  }

  return summary;
}
