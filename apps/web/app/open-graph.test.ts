import type { Metadata } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Metadonnees Open Graph de chaque page indexable : locale fr_TN, URL
// canonique, et toujours une image (un partage Facebook sans image passe
// inapercu). Les dependances serveur (API, police, en-tete) sont remplacees.
const { apiFetch, fetchLandingResults } = vi.hoisted(() => ({ apiFetch: vi.fn(), fetchLandingResults: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/api-client", () => ({ apiFetch }));
vi.mock("@/lib/landing-results", () => ({ fetchLandingResults }));
vi.mock("@/lib/favorites-server", () => ({ loadFavoriteContext: vi.fn() }));
vi.mock("next/font/google", () => ({ Readex_Pro: () => ({ variable: "font-sans" }) }));
vi.mock("./providers", () => ({ Providers: () => null }));
vi.mock("./site-header", () => ({ SiteHeader: () => null }));

import { metadata as layoutMetadata } from "./layout";
import { metadata as homeMetadata } from "./page";
import { generateMetadata as landingMetadata } from "./meilleur-prix/[slug]/page";
import { generateMetadata as productMetadata } from "./product/[id]/page";
import { generateMetadata as searchMetadata } from "./search/page";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";

type OpenGraph = Record<string, unknown> & { images?: unknown };
const og = (metadata: Metadata) => metadata.openGraph as OpenGraph;
const twitter = (metadata: Metadata) => metadata.twitter as Record<string, unknown>;

function productDetail(imageUrl: string | null) {
  const offer = {
    id: "o1",
    vendor_id: "v1",
    vendor_name: "Spacenet",
    price: "1599.000",
    currency: "TND",
    stock_status: "in_stock",
    url: "https://spacenet.tn/iphone-11.html",
    shipping_cost: null,
    scraped_at: "2026-10-03T08:00:00",
  };
  return {
    id: "p1",
    canonical_name: "apple-iphone-11",
    brand: "Apple",
    model: "iPhone 11 64Go Noir",
    category: "smartphones",
    specs: {},
    image_url: imageUrl,
    best_deal: offer,
    offers: [offer],
    price_history: [],
  };
}

beforeEach(() => {
  apiFetch.mockReset();
  fetchLandingResults.mockReset().mockResolvedValue([{ id: "p1" }]);
});

describe("image Open Graph par defaut", () => {
  it("1200x630 servie depuis le site, avec un texte alternatif", () => {
    expect(DEFAULT_OG_IMAGE).toEqual({
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "TopSoum, comparateur de prix électronique en Tunisie",
    });
  });

  it("fait partie de la base Open Graph fr_TN partagee par toutes les pages", () => {
    expect(BASE_OPEN_GRAPH).toEqual({
      type: "website",
      siteName: "TopSoum",
      locale: "fr_TN",
      images: [DEFAULT_OG_IMAGE],
    });
  });
});

describe("Open Graph par page", () => {
  it("layout : base fr_TN avec image, carte Twitter grand format", () => {
    expect(og(layoutMetadata)).toMatchObject({ locale: "fr_TN", images: [DEFAULT_OG_IMAGE] });
    expect(twitter(layoutMetadata).card).toBe("summary_large_image");
  });

  it("accueil : URL canonique et image par defaut", () => {
    expect(og(homeMetadata)).toMatchObject({ locale: "fr_TN", url: "/", images: [DEFAULT_OG_IMAGE] });
  });

  it("landing page : titre, URL et image par defaut", async () => {
    const metadata = await landingMetadata({ params: Promise.resolve({ slug: "iphone-15" }) });
    expect(og(metadata)).toMatchObject({
      locale: "fr_TN",
      url: "/meilleur-prix/iphone-15",
      title: "Meilleur prix iPhone 15 en Tunisie",
      images: [DEFAULT_OG_IMAGE],
    });
  });

  it("recherche : ne declare pas d'Open Graph, herite donc de celui du layout (fr_TN + image)", async () => {
    const metadata = await searchMetadata({ searchParams: Promise.resolve({ q: "iphone" }) });
    expect(metadata.openGraph).toBeUndefined();
    expect(og(layoutMetadata).images).toEqual([DEFAULT_OG_IMAGE]);
  });

  it("fiche produit : la photo du produit remplace l'image par defaut", async () => {
    apiFetch.mockResolvedValue(new Response(JSON.stringify(productDetail("https://spacenet.tn/iphone-11.jpg"))));

    const metadata = await productMetadata({ params: Promise.resolve({ id: "p1" }) });

    expect(metadata.title).toBe("Apple iPhone 11 64Go Noir au meilleur prix");
    expect(og(metadata)).toMatchObject({
      locale: "fr_TN",
      url: "/product/p1",
      images: [{ url: "https://spacenet.tn/iphone-11.jpg", alt: "Apple iPhone 11 64Go Noir" }],
    });
    expect(twitter(metadata).card).toBe("summary_large_image");
  });

  it("fiche produit sans photo : image par defaut plutot qu'aucune image", async () => {
    apiFetch.mockResolvedValue(new Response(JSON.stringify(productDetail(null))));

    const metadata = await productMetadata({ params: Promise.resolve({ id: "p2" }) });

    expect(og(metadata).images).toEqual([DEFAULT_OG_IMAGE]);
    expect(twitter(metadata).card).toBe("summary_large_image");
  });
});
