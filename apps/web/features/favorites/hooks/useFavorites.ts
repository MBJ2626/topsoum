"use client";

import { useQuery } from "@tanstack/react-query";

import type { FavoriteListResponse } from "@/lib/api-types";

async function fetchFavorites(): Promise<FavoriteListResponse> {
  const response = await fetch("/api/favorites");
  if (!response.ok) {
    throw new Error("Impossible de charger les favoris.");
  }
  return response.json();
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });
}
