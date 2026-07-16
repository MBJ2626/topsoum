"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { formatPrice } from "@/lib/format";
import { RECENTLY_VIEWED_QUERY_KEY, type RecentlyViewedItem } from "@/lib/recently-viewed";
import { useOnlineStatus } from "@/lib/use-online-status";

// Jamais "app inutilisable" hors ligne (cf. docs/PROJET.md 5.4) : bannière +
// derniers produits vus (cache React Query en memoire, voir recently-viewed.ts).
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const recentlyViewedQuery = useQuery<RecentlyViewedItem[]>({
    queryKey: RECENTLY_VIEWED_QUERY_KEY,
    queryFn: () => [],
    initialData: [],
    staleTime: Infinity,
  });

  if (isOnline) {
    return null;
  }

  const recentlyViewed = recentlyViewedQuery.data ?? [];

  return (
    <div className="sticky top-0 z-20 flex flex-col gap-2 border-b border-gray-200 bg-gray-50 p-3">
      <p className="text-sm font-medium text-gray-900">
        Connexion perdue — affichage des derniers produits consultes.
      </p>
      {recentlyViewed.length > 0 ? (
        <ul className="flex gap-3 overflow-x-auto">
          {recentlyViewed.map((item) => (
            <li key={item.id} className="flex-none">
              <Link href={`/product/${item.id}`} className="text-xs text-gray-700 underline">
                {item.name} — {formatPrice(item.price, item.currency)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
