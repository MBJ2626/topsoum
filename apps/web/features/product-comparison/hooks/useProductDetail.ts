"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductDetailResponse } from "@/lib/api-types";

async function fetchProductDetail(id: string): Promise<ProductDetailResponse> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new Error("Impossible de charger le produit.");
  }
  return response.json();
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductDetail(id),
    enabled: id.length > 0,
  });
}
