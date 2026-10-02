import "server-only";

import { auth } from "@/auth";
import { apiFetch } from "@/lib/api-client";
import type { FavoriteListResponse } from "@/lib/api-types";

export interface InitialFavorite {
  favoriteId: string;
  priceTracking: boolean;
}

export interface FavoriteContext {
  isAuthenticated: boolean;
  /** Favoris de l'utilisateur, par product_id. */
  favoritesByProduct: Record<string, InitialFavorite>;
}

/** Session + favoris, pour afficher l'etoile seulement si elle peut marcher. */
export async function loadFavoriteContext(): Promise<FavoriteContext> {
  const session = await auth();
  if (!session) {
    return { isAuthenticated: false, favoritesByProduct: {} };
  }

  const response = await apiFetch("/favorites");
  if (!response.ok) {
    return { isAuthenticated: true, favoritesByProduct: {} };
  }

  const data: FavoriteListResponse = await response.json();
  return {
    isAuthenticated: true,
    favoritesByProduct: Object.fromEntries(
      data.results.map((favorite) => [
        favorite.product_id,
        { favoriteId: favorite.id, priceTracking: favorite.price_tracking },
      ]),
    ),
  };
}
