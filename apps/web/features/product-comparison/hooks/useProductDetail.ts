"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductDetailResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchProductDetail(id: string): Promise<ProductDetailResponse> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new HttpError("Impossible de charger le produit.", response.status);
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
