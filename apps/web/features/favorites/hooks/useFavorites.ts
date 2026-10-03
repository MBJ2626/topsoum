"use client";

import { useQuery } from "@tanstack/react-query";

import type { FavoriteListResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchFavorites(): Promise<FavoriteListResponse> {
  const response = await fetch("/api/favorites");
  if (!response.ok) {
    throw new HttpError("Impossible de charger les favoris.", response.status);
  }
  return response.json();
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });
}
