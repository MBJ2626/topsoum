// CLI du pipeline ETL : charge un fichier scrape en DB.
import { prisma } from "@topsoum/db-schema";

import { loadScrapedFile } from "./pipeline";

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm --filter @topsoum/etl-pipeline load <chemin-du-json-scrape>");
    process.exitCode = 1;
    return;
  }

  const { raw, normalized, rejected, summary } = await loadScrapedFile(inputPath);
  console.log(`${normalized}/${raw} offres normalisees (${rejected} rejetees)`);
  console.log(
    `Vendeurs upserted: ${summary.vendorsUpserted}, Produits crees: ${summary.productsCreated}, ` +
      `Produits matches: ${summary.productsMatched}, A valider: ${summary.productsPendingReview}, ` +
      `Offres upserted: ${summary.offersUpserted}, Historique insere: ${summary.priceHistoryInserted}, ` +
      `Offres rejetees au chargement: ${summary.offersRejected}`,
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
