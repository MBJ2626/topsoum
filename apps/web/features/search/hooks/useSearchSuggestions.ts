"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";

async function fetchSuggestions(query: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
  if (!response.ok) {
    throw new Error("La recherche de suggestions a echoue");
  }
  return response.json();
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => fetchSuggestions(query),
    enabled: query.trim().length >= 2,
  });
}
