"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { LINK_PENDING_CLASS, LinkPending } from "@/components/ui/LinkPending";
import { ProductImage } from "@/components/ui/ProductImage";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { FavoriteToggle } from "@/features/favorites/components/FavoriteToggle";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { formatPrice } from "@/lib/format";

export function FavoritesPageClient({ signOutSlot }: { signOutSlot: ReactNode }) {
  const favoritesQuery = useFavorites();

  if (favoritesQuery.status === "pending") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
        {[0, 1, 2].map((row) => (
          <SkeletonBlock key={row} className="h-20 w-full" />
        ))}
      </main>
    );
  }

  if (favoritesQuery.status === "error") {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <ErrorState message="Impossible de charger vos favoris." onRetry={() => favoritesQuery.refetch()} />
      </main>
    );
  }

  const { results } = favoritesQuery.data;

  if (results.length === 0) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-medium text-gray-900">Mes favoris</h1>
          {signOutSlot}
        </div>
        <div className="rounded-card border border-gray-200 bg-white p-6 text-center">
          <p className="text-base font-medium text-gray-900">Aucun favori pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-gray-500">Ajoutez un produit avec l&apos;étoile pour le retrouver ici.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-medium text-gray-900">Mes favoris</h1>
        {signOutSlot}
      </div>
      <ul className="flex flex-col gap-3">
        {results.map((favorite) => (
          <li
            key={favorite.id}
            className="flex items-center justify-between gap-3 rounded-card border border-gray-200 bg-white p-3 sm:p-4"
          >
            <Link href={`/product/${favorite.product_id}`} className={`flex flex-1 items-center gap-3 ${LINK_PENDING_CLASS}`}>
              <LinkPending />
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-key">
                {favorite.product_image_url ? (
                  <ProductImage src={favorite.product_image_url} alt={favorite.product_name} sizes="56px" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{favorite.product_name}</p>
                {favorite.best_offer_price != null ? (
                  <p className="tabular text-sm text-gray-500">
                    {formatPrice(favorite.best_offer_price, "TND")}
                    {favorite.best_offer_vendor ? ` chez ${favorite.best_offer_vendor}` : ""}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Prix en cours de mise à jour</p>
                )}
              </div>
            </Link>

            <FavoriteToggle
              productId={favorite.product_id}
              initialFavorite={{ favoriteId: favorite.id, priceTracking: favorite.price_tracking }}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
