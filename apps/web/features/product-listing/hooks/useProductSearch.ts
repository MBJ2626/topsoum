"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

/** Filtres appliques par l'API (GET /products/search) ; null = filtre inactif. */
export interface SearchFilters {
  brand: string | null;
  ramGb: number | null;
  maxPrice: number | null;
}

function searchUrl(query: string, filters: SearchFilters | null): string {
  let url = `/api/products/search?q=${encodeURIComponent(query)}&limit=20`;
  if (filters?.brand != null) url += `&brand=${encodeURIComponent(filters.brand)}`;
  if (filters?.ramGb != null) url += `&ram_gb=${filters.ramGb}`;
  if (filters?.maxPrice != null) url += `&max_price=${filters.maxPrice}`;
  return url;
}

function activeFilters(filters?: SearchFilters): SearchFilters | null {
  if (!filters) return null;
  return filters.brand != null || filters.ramGb != null || filters.maxPrice != null ? filters : null;
}

async function fetchProductSearch(query: string, filters: SearchFilters | null): Promise<ProductSearchResponse> {
  const response = await fetch(searchUrl(query, filters));
  if (!response.ok) {
    throw new HttpError("La recherche a échoué.", response.status);
  }
  return response.json();
}

export function useProductSearch(query: string, filters?: SearchFilters) {
  const active = activeFilters(filters);
  return useQuery({
    // Sans filtre actif : meme cle que la recherche rendue cote serveur (cache reutilise).
    queryKey: active ? ["product-search", query, active] : ["product-search", query],
    queryFn: () => fetchProductSearch(query, active),
    enabled: query.trim().length > 0,
    // Changement de filtre : les resultats precedents restent affiches pendant le chargement.
    placeholderData: keepPreviousData,
  });
}
