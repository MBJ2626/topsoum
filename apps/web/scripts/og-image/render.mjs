// Genere public/og.png (image Open Graph par defaut) depuis og.html.
// Usage (depuis apps/web) : node scripts/og-image/render.mjs
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const source = new URL("./og.html", import.meta.url);
const output = fileURLToPath(new URL("../../public/og.png", import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(source.href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: output, type: "png" });
await browser.close();
console.log(`OK ${output}`);
