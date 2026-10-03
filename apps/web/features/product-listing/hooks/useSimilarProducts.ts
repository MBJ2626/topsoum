"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductSearchResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchSimilarProducts(category: string): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?category=${encodeURIComponent(category)}&limit=6`);
  if (!response.ok) {
    throw new HttpError("Impossible de charger les produits similaires.", response.status);
  }
  return response.json();
}

export function useSimilarProducts(category: string) {
  return useQuery({
    queryKey: ["similar-products", category],
    queryFn: () => fetchSimilarProducts(category),
    enabled: category.length > 0,
  });
}
