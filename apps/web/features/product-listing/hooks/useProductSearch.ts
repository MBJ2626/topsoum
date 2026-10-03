"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchProductSearch(query: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=20`);
  if (!response.ok) {
    throw new HttpError("La recherche a échoué.", response.status);
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
