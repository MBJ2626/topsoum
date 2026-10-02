// Chargement d'un fichier scrape : normalisation + matching + DB, trace dans
// scraper_runs. Partage par la CLI (index.ts) et le worker de scans (worker.ts).
import { readFileSync } from "node:fs";

import { prisma } from "@topsoum/db-schema";
import type { ScrapedOffer } from "@topsoum/shared-types";

import { loadManualOverrideTable, loadOffers, resolveVendor, type LoadSummary } from "./load";
import { createDefaultMatchingEngine } from "./matching";
import { normalizeOffer } from "./normalize";
import type { RawScrapedOffer } from "./types";

export interface PipelineReport {
  raw: number;
  normalized: number;
  /** Offres rejetees a la normalisation. */
  rejected: number;
  summary: LoadSummary;
}

export async function loadScrapedFile(inputPath: string): Promise<PipelineReport> {
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

    return { raw: raw.length, normalized: normalized.length, rejected, summary };
  } catch (error) {
    await prisma.scraperRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), errorCount: raw.length },
    });
    throw error;
  }
}
