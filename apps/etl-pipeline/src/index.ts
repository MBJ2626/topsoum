// Point d'entree du pipeline ETL basique : normalisation + chargement DB.
// TODO Etape 4 : brancher matchingEngine pour le matching cross-vendeur
// (actuellement une offre = un produit par vendeur, cf. normalize.ts).
import { readFileSync } from "node:fs";

import { prisma } from "@topsoum/db-schema";
import type { ScrapedOffer } from "@topsoum/shared-types";

import { loadOffers } from "./load";
import { normalizeOffer } from "./normalize";
import type { RawScrapedOffer } from "./types";

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm --filter @topsoum/etl-pipeline dev <chemin-du-json-scrape>");
    process.exitCode = 1;
    return;
  }

  const raw = JSON.parse(readFileSync(inputPath, "utf-8")) as RawScrapedOffer[];

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

  const summary = await loadOffers(normalized);

  console.log(`${normalized.length}/${raw.length} offres normalisees (${rejected} rejetees)`);
  console.log(
    `Vendeurs upserted: ${summary.vendorsUpserted}, Produits upserted: ${summary.productsUpserted}, ` +
      `Offres upserted: ${summary.offersUpserted}, Historique insere: ${summary.priceHistoryInserted}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
