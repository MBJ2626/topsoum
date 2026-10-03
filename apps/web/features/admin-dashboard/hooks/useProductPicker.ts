"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

// Reutilise la route /api/products/search (publique) plutot que d'importer
// le hook useProductSearch de product-listing : les features restent
// decouplees (meme regle que le slot favoriteSlot de BestDealCard).
async function fetchProductPicker(query: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=8`);
  if (!response.ok) {
    throw new HttpError("La recherche de produit a échoué.", response.status);
  }
  return response.json();
}

export function useProductPicker(query: string) {
  return useQuery({
    queryKey: ["admin-product-picker", query],
    queryFn: () => fetchProductPicker(query),
    enabled: query.trim().length > 1,
  });
}
