import { prisma } from "@topsoum/db-schema";
import type { ScrapedOffer } from "@topsoum/shared-types";

import { canonicalNameFor, VENDOR_DISPLAY_NAMES } from "./normalize";

export interface LoadSummary {
  vendorsUpserted: number;
  productsUpserted: number;
  offersUpserted: number;
  priceHistoryInserted: number;
}

/**
 * Charge des offres normalisees en DB : Vendor -> Product -> Offer -> PriceHistory.
 * Pas de matching cross-vendeur ici (Etape 4, matchingEngine) : chaque offre
 * est rattachee a un Product identifie par marque + reference/nom + vendeur.
 */
export async function loadOffers(offers: ScrapedOffer[]): Promise<LoadSummary> {
  const summary: LoadSummary = {
    vendorsUpserted: 0,
    productsUpserted: 0,
    offersUpserted: 0,
    priceHistoryInserted: 0,
  };

  const vendorIdBySlug = new Map<string, string>();

  for (const offer of offers) {
    let vendorId = vendorIdBySlug.get(offer.vendor);
    if (!vendorId) {
      const vendorName = VENDOR_DISPLAY_NAMES[offer.vendor] ?? offer.vendor;
      const vendor = await prisma.vendor.upsert({
        where: { name: vendorName },
        create: { name: vendorName },
        update: {},
      });
      vendorId = vendor.id;
      vendorIdBySlug.set(offer.vendor, vendorId);
      summary.vendorsUpserted += 1;
    }

    const canonicalName = canonicalNameFor(offer);
    const product = await prisma.product.upsert({
      where: { canonicalName },
      create: {
        canonicalName,
        brand: offer.brand ?? "Generique",
        model: offer.productName,
        category: offer.category,
        imageUrl: offer.imageUrl,
      },
      update: {
        imageUrl: offer.imageUrl ?? undefined,
      },
    });
    summary.productsUpserted += 1;

    const savedOffer = await prisma.offer.upsert({
      where: { productId_vendorId: { productId: product.id, vendorId } },
      create: {
        productId: product.id,
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
  }

  return summary;
}
