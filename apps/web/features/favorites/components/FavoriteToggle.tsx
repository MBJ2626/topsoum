"use client";

import { useState } from "react";

import { StarIcon } from "@/components/ui/icons";

import { useAddFavorite, useRemoveFavorite, useToggleTracking } from "../hooks/useFavoriteMutations";

export interface FavoriteState {
  favoriteId: string;
  priceTracking: boolean;
}

interface FavoriteToggleProps {
  productId: string;
  /** null = produit pas encore ajoute aux favoris. */
  initialFavorite: FavoriteState | null;
}

export function FavoriteToggle({ productId, initialFavorite }: FavoriteToggleProps) {
  const [favorite, setFavorite] = useState<FavoriteState | null>(initialFavorite);
  const [favoriteError, setFavoriteError] = useState(false);
  const [trackingError, setTrackingError] = useState(false);

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const toggleTracking = useToggleTracking();

  function handleFavoriteClick() {
    setFavoriteError(false);

    if (favorite) {
      removeFavorite.mutate(favorite.favoriteId, {
        onSuccess: () => setFavorite(null),
        onError: () => setFavoriteError(true),
      });
      return;
    }

    addFavorite.mutate(productId, {
      onSuccess: (created) => setFavorite({ favoriteId: created.id, priceTracking: created.price_tracking }),
      onError: () => setFavoriteError(true),
    });
  }

  function handleTrackingChange() {
    if (!favorite) return;
    setTrackingError(false);

    // Toggle manuel explicite : jamais active automatiquement lors de l'ajout
    // aux favoris (regle immuable, voir CLAUDE.md).
    const nextTracking = !favorite.priceTracking;
    toggleTracking.mutate(
      { favoriteId: favorite.favoriteId, priceTracking: nextTracking },
      {
        onSuccess: (updated) => setFavorite({ favoriteId: updated.id, priceTracking: updated.price_tracking }),
        onError: () => setTrackingError(true),
      },
    );
  }

  const isFavoritePending = addFavorite.isPending || removeFavorite.isPending;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={isFavoritePending}
        aria-pressed={favorite != null}
        aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={`flex h-11 w-11 items-center justify-center rounded-key border transition-[border-color,color,transform] duration-150 active:scale-95 disabled:opacity-50 ${
          favorite ? "border-gray-900 text-gray-900" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
        }`}
      >
        <StarIcon size={20} filled={favorite != null} className={isFavoritePending ? "animate-pulse" : undefined} />
      </button>

      {favoriteError ? (
        <button type="button" onClick={handleFavoriteClick} className="text-xs text-red-600 underline">
          Échec, réessayer
        </button>
      ) : null}

      {favorite ? (
        <label className="flex min-h-[44px] items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={favorite.priceTracking}
            onChange={handleTrackingChange}
            disabled={toggleTracking.isPending}
            className="h-5 w-5 accent-accent"
          />
          Suivi de prix
        </label>
      ) : null}

      {trackingError ? (
        <button type="button" onClick={handleTrackingChange} className="text-xs text-red-600 underline">
          Échec du suivi, réessayer
        </button>
      ) : null}
    </div>
  );
}
