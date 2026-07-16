"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { FavoriteToggle } from "@/features/favorites/components/FavoriteToggle";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { formatPrice } from "@/lib/format";

export function FavoritesPageClient() {
  const favoritesQuery = useFavorites();

  if (favoritesQuery.status === "pending") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3 p-4">
        {[0, 1, 2].map((row) => (
          <SkeletonBlock key={row} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (favoritesQuery.status === "error") {
    return (
      <div className="mx-auto max-w-xl p-4">
        <ErrorState message="Impossible de charger tes favoris." onRetry={() => favoritesQuery.refetch()} />
      </div>
    );
  }

  const { results } = favoritesQuery.data;

  if (results.length === 0) {
    return <p className="p-6 text-center text-sm text-gray-500">Aucun favori pour l&apos;instant.</p>;
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 p-4">
      <h1 className="text-lg font-medium text-gray-900">Mes favoris</h1>
      <ul className="flex flex-col gap-3">
        {results.map((favorite) => (
          <li
            key={favorite.id}
            className="flex items-center justify-between gap-3 rounded-card border border-gray-100 p-3"
          >
            <Link href={`/product/${favorite.product_id}`} className="flex flex-1 items-center gap-3">
              <div className="h-14 w-14 flex-none overflow-hidden rounded-lg bg-gray-50">
                {favorite.product_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- domaines vendeurs multiples et dynamiques
                  <img
                    src={favorite.product_image_url}
                    alt={favorite.product_name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{favorite.product_name}</p>
                {favorite.best_offer_price != null ? (
                  <p className="text-sm text-gray-500">
                    {formatPrice(favorite.best_offer_price, "TND")}
                    {favorite.best_offer_vendor ? ` — ${favorite.best_offer_vendor}` : ""}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Prix en cours de mise a jour</p>
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
