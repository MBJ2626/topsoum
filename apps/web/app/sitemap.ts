import type { MetadataRoute } from "next";

import { apiFetch } from "@/lib/api-client";
import type { ProductSitemapResponse } from "@/lib/api-types";
import { LANDING_PAGES } from "@/lib/landing-pages";
import { fetchLandingResults } from "@/lib/landing-results";
import { SITE_URL } from "@/lib/site";

// Genere a chaque requete : la liste des produits change a chaque run des
// scrapers, et un sitemap fige au build serait vide ou perime.
export const dynamic = "force-dynamic";

// Uniquement les pages indexables : accueil, landing pages ayant des produits
// et fiches produit (les pages de recherche sont en noindex, favoris/admin
// sont prives).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await apiFetch("/products/sitemap", { auth: false });
  if (!response.ok) {
    // Echec franc (500) plutot qu'un sitemap tronque : Google reessaiera.
    throw new Error(`Sitemap indisponible (API ${response.status})`);
  }
  const data: ProductSitemapResponse = await response.json();

  // Une landing vide est en noindex : elle n'a rien a faire dans le sitemap.
  const landingResults = await Promise.all(LANDING_PAGES.map((page) => fetchLandingResults(page)));
  const indexableLandings = LANDING_PAGES.filter((_, index) => landingResults[index].length > 0);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...indexableLandings.map((page) => ({
      url: `${SITE_URL}/meilleur-prix/${page.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...data.results.map((entry) => ({
      url: `${SITE_URL}/product/${entry.id}`,
      lastModified: new Date(entry.last_modified),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
