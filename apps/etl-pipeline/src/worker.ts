// Worker des scans : execute les scans demandes depuis le dashboard admin et
// ceux de la planification. Un scan a la fois : scraper vendeur puis ETL.
// Lancement : pnpm --filter @topsoum/etl-pipeline worker (aussi via pnpm dev).
import { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { Prisma, prisma } from "@topsoum/db-schema";

import { loadScrapedFile } from "./pipeline";
import { listVendorSlugs, runScraper } from "./scans/runScraper";
import { aggregateStatus, dueSlots, type VendorScanResult } from "./scans/schedule";

const POLL_MS = 15_000;
const SCHEDULE_ID = "default";

let stopping = false;

async function heartbeatAndSchedule(now: Date): Promise<void> {
  const schedule = await prisma.scanSchedule.upsert({
    where: { id: SCHEDULE_ID },
    create: { id: SCHEDULE_ID, workerSeenAt: now },
    update: { workerSeenAt: now },
  });
  if (!schedule.enabled) return;

  for (const slot of dueSlots({ times: schedule.times, configuredAt: schedule.configuredAt, now })) {
    try {
      await prisma.scanJob.create({ data: { trigger: "scheduled", vendors: [], scheduledFor: slot } });
      console.log(`Scan planifie ajoute a la file (${slot.toISOString()})`);
    } catch (error) {
      // Creneau deja en file (scheduled_for unique) : rien a faire.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
}

async function claimNextJob() {
  const next = await prisma.scanJob.findFirst({ where: { status: "queued" }, orderBy: { requestedAt: "asc" } });
  if (!next) return null;
  const claimed = await prisma.scanJob.updateMany({
    where: { id: next.id, status: "queued" },
    data: { status: "running", startedAt: new Date() },
  });
  return claimed.count === 1 ? next : null;
}

async function scanVendor(jobId: string, vendor: string, known: string[]): Promise<VendorScanResult> {
  if (!known.includes(vendor)) {
    return { vendor, offersCollected: null, scanFailures: 0, offersLoaded: null, error: "Vendeur inconnu" };
  }

  const outputPath = path.join(os.tmpdir(), `topsoum-scan-${jobId}-${vendor}.json`);
  try {
    const outcome = await runScraper(vendor, outputPath);
    if (outcome.exitCode !== 0) {
      return {
        vendor,
        offersCollected: outcome.offersCollected,
        scanFailures: outcome.scanFailures,
        offersLoaded: null,
        error: `Scraper en echec (code ${outcome.exitCode ?? "?"}) : ${outcome.stderrTail || "aucun detail"}`,
      };
    }
    if (!outcome.offersCollected) {
      return { vendor, offersCollected: 0, scanFailures: outcome.scanFailures, offersLoaded: null, error: "Aucune offre collectee" };
    }

    const report = await loadScrapedFile(outputPath);
    return {
      vendor,
      offersCollected: outcome.offersCollected,
      scanFailures: outcome.scanFailures,
      offersLoaded: report.summary.offersUpserted,
      error: null,
    };
  } catch (error) {
    return { vendor, offersCollected: null, scanFailures: 0, offersLoaded: null, error: (error as Error).message.slice(0, 500) };
  } finally {
    rmSync(outputPath, { force: true });
  }
}

async function runJob(job: { id: string; vendors: string[] }): Promise<void> {
  const known = listVendorSlugs();
  const vendors = job.vendors.length > 0 ? job.vendors : known;
  const results: VendorScanResult[] = [];
  console.log(`Scan ${job.id} : ${vendors.join(", ")}`);

  for (const vendor of vendors) {
    results.push(await scanVendor(job.id, vendor, known));
    // Progression visible dans le dashboard pendant le scan.
    await prisma.scanJob.update({ where: { id: job.id }, data: { results: results as unknown as Prisma.InputJsonValue } });
  }

  const status = aggregateStatus(results);
  await prisma.scanJob.update({ where: { id: job.id }, data: { status, finishedAt: new Date() } });
  console.log(`Scan ${job.id} termine : ${status}`);
}

async function main(): Promise<void> {
  // Un scan "running" au demarrage a ete coupe par l'arret du worker precedent.
  const interrupted = await prisma.scanJob.updateMany({
    where: { status: "running" },
    data: { status: "failed", finishedAt: new Date(), error: "Interrompu : le worker a redemarre." },
  });
  if (interrupted.count > 0) console.warn(`${interrupted.count} scan(s) interrompu(s) marque(s) en echec`);
  console.log(`Worker de scans pret (vendeurs : ${listVendorSlugs().join(", ")})`);

  while (!stopping) {
    try {
      await heartbeatAndSchedule(new Date());
      const job = await claimNextJob();
      if (job) {
        await runJob(job);
        continue;
      }
    } catch (error) {
      console.error("Erreur du worker de scans :", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
