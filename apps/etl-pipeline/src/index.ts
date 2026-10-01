// Point d'entree du pipeline ETL : normalisation + matching + chargement DB.
import { readFileSync } from "node:fs";

import { prisma } from "@topsoum/db-schema";
import type { ScrapedOffer } from "@topsoum/shared-types";

import { loadManualOverrideTable, loadOffers, resolveVendor } from "./load";
import { createDefaultMatchingEngine } from "./matching";
import { normalizeOffer } from "./normalize";
import type { RawScrapedOffer } from "./types";

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm --filter @topsoum/etl-pipeline load <chemin-du-json-scrape>");
    process.exitCode = 1;
    return;
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf-8")) as RawScrapedOffer[];
  const vendorSlug = raw[0]?.vendor?.trim().toLowerCase() ?? "unknown";
  const vendorId = await resolveVendor(vendorSlug, new Map());
  const run = await prisma.scraperRun.create({ data: { vendorId } });

  try {
    const normalized: ScrapedOffer[] = [];
    let rejected = 0;
    for (const item of raw) {
      try {
        normalized.push(normalizeOffer(item));
      } catch (error) {
        rejected += 1;
        console.warn(`Offre rejetee (${item.url ?? "url inconnue"}): ${(error as Error).message}`);
      }
    }

    const overrideTable = await loadManualOverrideTable();
    const summary = await loadOffers(normalized, { matchingEngine: createDefaultMatchingEngine(overrideTable) });

    await prisma.scraperRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        productsCollected: summary.productsCreated + summary.productsMatched,
        successCount: normalized.length - summary.offersRejected,
        errorCount: rejected + summary.offersRejected,
      },
    });

    console.log(`${normalized.length}/${raw.length} offres normalisees (${rejected} rejetees)`);
    console.log(
      `Vendeurs upserted: ${summary.vendorsUpserted}, Produits crees: ${summary.productsCreated}, ` +
        `Produits matches: ${summary.productsMatched}, A valider: ${summary.productsPendingReview}, ` +
        `Offres upserted: ${summary.offersUpserted}, Historique insere: ${summary.priceHistoryInserted}, ` +
        `Offres rejetees au chargement: ${summary.offersRejected}`,
    );
  } catch (error) {
    await prisma.scraperRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), errorCount: raw.length },
    });
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
