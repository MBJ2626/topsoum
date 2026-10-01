"use client";

import { useMutation } from "@tanstack/react-query";

import type { FavoriteOut } from "@/lib/api-types";

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
  return response.json() as Promise<T>;
}

export function useAddFavorite() {
  return useMutation({
    mutationFn: async (productId: string): Promise<FavoriteOut> => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      return parseJsonOrThrow<FavoriteOut>(response, "Impossible d'ajouter aux favoris.");
    },
  });
}

export function useRemoveFavorite() {
  return useMutation({
    mutationFn: async (favoriteId: string): Promise<void> => {
      const response = await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Impossible de retirer des favoris.");
      }
    },
  });
}

export function useToggleTracking() {
  return useMutation({
    mutationFn: async ({
      favoriteId,
      priceTracking,
    }: {
      favoriteId: string;
      priceTracking: boolean;
    }): Promise<FavoriteOut> => {
      const response = await fetch(`/api/favorites/${favoriteId}/tracking`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ price_tracking: priceTracking }),
      });
      return parseJsonOrThrow<FavoriteOut>(response, "Impossible de mettre à jour le suivi de prix.");
    },
  });
}
