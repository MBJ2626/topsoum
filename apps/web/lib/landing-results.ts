import { cache } from "react";

import { apiFetch } from "@/lib/api-client";
import type { ProductSearchResponse, ProductSearchResult } from "@/lib/api-types";
import type { LandingPage } from "@/lib/landing-pages";

/** Plafond de l'API de recherche (limit <= 100). */
const MAX_RESULTS = 100;

/**
 * Produits d'une landing page, deja tries par meilleur deal par l'API.
 * Partage entre la page, ses metadonnees (noindex si vide) et le sitemap.
 * cache() : un seul appel API par requete, meme si plusieurs appelants.
 */
export const fetchLandingResults = cache(async (page: LandingPage): Promise<ProductSearchResult[]> => {
  const params = new URLSearchParams({ limit: String(MAX_RESULTS) });
  if (page.query) params.set("q", page.query);
  if (page.category) params.set("category", page.category);

  const response = await apiFetch(`/products/search?${params.toString()}`, { auth: false, forwardClientIp: false });
  if (!response.ok) {
    throw new Error(`Landing ${page.slug} : recherche impossible (API ${response.status})`);
  }
  const data: ProductSearchResponse = await response.json();

  if (page.maxPrice == null) return data.results;
  const maxPrice = page.maxPrice;
  // L'API ne filtre pas par prix : filtre ici, sur le meilleur deal. Un prix
  // douteux (<= 0) n'est jamais presente comme "pas cher".
  return data.results.filter((result) => {
    const price = Number(result.best_deal.price);
    return price > 0 && price <= maxPrice;
  });
});
