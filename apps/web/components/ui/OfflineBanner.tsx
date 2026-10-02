"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { displayPrice } from "@/lib/format";
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
    <div role="status" className="sticky top-0 z-30 flex flex-col gap-2 bg-gray-900 px-4 py-3 text-white">
      <p className="text-sm font-medium">
        {recentlyViewed.length > 0 ? "Connexion perdue. Derniers produits consultés :" : "Connexion perdue."}
      </p>
      {recentlyViewed.length > 0 ? (
        <ul className="flex gap-3 overflow-x-auto">
          {recentlyViewed.map((item) => (
            <li key={item.id} className="flex-none">
              <Link href={`/product/${item.id}`} className="tabular inline-flex min-h-[44px] items-center text-xs text-gray-200 underline underline-offset-2">
                {item.name}, {displayPrice(item.price, item.currency)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
