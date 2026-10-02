// Lance un scraper vendeur (apps/scrapers, Python) dans un sous-processus.
// Le worker ne connait les vendeurs que par leur dossier : aucun import Python.
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const SCRAPERS_DIR = path.resolve(__dirname, "../../../scrapers");

/** Vendeurs disponibles = dossiers vendors/{slug}/ ayant un __main__.py. */
export function listVendorSlugs(scrapersDir = SCRAPERS_DIR): string[] {
  const vendorsDir = path.join(scrapersDir, "vendors");
  return readdirSync(vendorsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(vendorsDir, entry.name, "__main__.py")))
    .map((entry) => entry.name)
    .sort();
}

export interface ScraperOutcome {
  exitCode: number | null;
  offersCollected: number | null;
  scanFailures: number;
  /** Dernieres lignes de stderr, pour expliquer un echec dans le dashboard. */
  stderrTail: string;
}

/** Lit "N offres collectees" (stdout) et "N echec(s)" (stderr) ecrits par vendors/{slug}/__main__.py. */
export function parseScraperOutput(stdout: string, stderr: string): Pick<ScraperOutcome, "offersCollected" | "scanFailures"> {
  const offers = /(\d+) offres collectees/.exec(stdout);
  const failures = /(\d+) echec\(s\)/.exec(stderr);
  return {
    offersCollected: offers ? Number(offers[1]) : null,
    scanFailures: failures ? Number(failures[1]) : 0,
  };
}

export function runScraper(vendor: string, outputPath: string, scrapersDir = SCRAPERS_DIR): Promise<ScraperOutcome> {
  return new Promise((resolve) => {
    const child = spawn("uv", ["run", "python", "-m", `vendors.${vendor}`, "--output", outputPath], {
      cwd: scrapersDir,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));

    const finish = (exitCode: number | null, extraError = "") => {
      const tail = `${stderr}${extraError}`
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-3)
        .join(" | ")
        .slice(-500);
      resolve({ exitCode, ...parseScraperOutput(stdout, stderr), stderrTail: tail });
    };
    child.on("error", (error) => finish(null, `\n${error.message}`));
    child.on("close", (code) => finish(code));
  });
}
