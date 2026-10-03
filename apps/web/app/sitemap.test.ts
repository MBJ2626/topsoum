import { beforeEach, describe, expect, it, vi } from "vitest";

import { LANDING_PAGES } from "@/lib/landing-pages";

const { apiFetch, fetchLandingResults } = vi.hoisted(() => ({ apiFetch: vi.fn(), fetchLandingResults: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));
vi.mock("@/lib/landing-results", () => ({ fetchLandingResults }));

import sitemap from "./sitemap";

function sitemapApi(results: { id: string; last_modified: string }[]) {
  return new Response(JSON.stringify({ count: results.length, results }), { status: 200 });
}

beforeEach(() => {
  apiFetch.mockReset().mockResolvedValue(sitemapApi([]));
  fetchLandingResults.mockReset().mockResolvedValue([{ id: "p" }]);
});

describe("sitemap.xml", () => {
  it("lit les fiches produit via l'endpoint public /products/sitemap, sans session", async () => {
    await sitemap();
    expect(apiFetch).toHaveBeenCalledWith("/products/sitemap", { auth: false });
  });

  it("commence par l'accueil sur topsoum.com, en priorite maximale", async () => {
    const [home] = await sitemap();
    expect(home).toEqual({ url: "https://topsoum.com", changeFrequency: "daily", priority: 1 });
  });

  it("liste chaque landing page ayant des produits", async () => {
    const entries = await sitemap();
    const landings = entries.filter((entry) => entry.url.includes("/meilleur-prix/"));

    expect(landings.map((entry) => entry.url)).toEqual(
      LANDING_PAGES.map((page) => `https://topsoum.com/meilleur-prix/${page.slug}`),
    );
    expect(landings.every((entry) => entry.priority === 0.9)).toBe(true);
  });

  it("omet une landing page vide (elle est en noindex)", async () => {
    const empty = LANDING_PAGES[0];
    fetchLandingResults.mockImplementation(async (page) => (page.slug === empty.slug ? [] : [{ id: "p" }]));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).not.toContain(`https://topsoum.com/meilleur-prix/${empty.slug}`);
    expect(urls.filter((url) => url.includes("/meilleur-prix/"))).toHaveLength(LANDING_PAGES.length - 1);
  });

  it("liste chaque fiche produit avec sa date de derniere modification", async () => {
    apiFetch.mockResolvedValue(
      sitemapApi([
        { id: "p1", last_modified: "2026-10-01T17:17:13.330000+00:00" },
        { id: "p2", last_modified: "2026-10-02T16:20:33.896000+00:00" },
      ]),
    );

    const products = (await sitemap()).filter((entry) => entry.url.includes("/product/"));

    expect(products).toEqual([
      { url: "https://topsoum.com/product/p1", lastModified: new Date("2026-10-01T17:17:13.330Z"), changeFrequency: "daily", priority: 0.8 },
      { url: "https://topsoum.com/product/p2", lastModified: new Date("2026-10-02T16:20:33.896Z"), changeFrequency: "daily", priority: 0.8 },
    ]);
  });

  it("n'expose ni la recherche, ni les favoris, ni l'admin", async () => {
    apiFetch.mockResolvedValue(sitemapApi([{ id: "p1", last_modified: "2026-10-01T00:00:00+00:00" }]));
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => /\/(search|favorites|admin|api)\b/.test(url))).toBe(false);
  });

  it("echoue franchement si l'API ne repond pas (Google reessaiera, pas de sitemap tronque)", async () => {
    apiFetch.mockResolvedValue(new Response("", { status: 503 }));
    await expect(sitemap()).rejects.toThrow("Sitemap indisponible (API 503)");
  });
});
