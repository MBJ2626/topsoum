"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";

async function fetchProductSearch(query: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=20`);
  if (!response.ok) {
    throw new Error("La recherche a échoué.");
  }
  return response.json();
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["product-search", query],
    queryFn: () => fetchProductSearch(query),
    enabled: query.trim().length > 0,
  });
}
