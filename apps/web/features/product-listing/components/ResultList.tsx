"use client";

import Link from "next/link";
import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";

export interface ResultListItem {
  id: string;
  productName: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  vendorName: string;
  offersCount: number;
}

interface ResultListProps {
  state: AsyncState<ResultListItem[]>;
  /** Requis des que l'etat peut etre "error" (hooks React Query). */
  onRetry?: () => void;
  /**
   * Nombre de lignes visibles d'emblee. Les landing pages SEO affichent tout :
   * Google ne lit que le HTML initial, pas ce qui est derriere "Afficher plus".
   */
  initialVisibleCount?: number;
}

/** Pagination par batches (docs/PROJET.md 5.4 : 10-15 produits). */
const BATCH_SIZE = 10;

// Autres produits de la recherche, sous la reponse dominante. Discret par
// design (pas d'accent) : seul le BestDealCard porte l'accent "meilleur prix".
export function ResultList({ state, onRetry, initialVisibleCount = BATCH_SIZE }: ResultListProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  if (state.status === "loading") {
    return (
      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex items-center gap-3 py-3">
            <SkeletonBlock className="h-12 w-12 flex-none" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonLine className="w-2/3" />
              <SkeletonLine className="w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        message="Impossible de charger les autres resultats."
        onRetry={onRetry ?? (() => window.location.reload())}
      />
    );
  }

  const { data } = state;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {data.slice(0, visibleCount).map((item) => (
          <li key={item.id} data-testid="result-row">
            <Link href={`/product/${item.id}`} className="flex min-h-[44px] items-center gap-3 py-3">
              <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-gray-50">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- domaines vendeurs multiples et dynamiques
                  <img src={item.imageUrl} alt={item.productName} loading="lazy" className="h-full w-full object-contain" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {item.offersCount > 1 ? `${item.offersCount} vendeurs` : item.vendorName}
                </p>
              </div>
              <span className="flex-none text-sm font-medium text-gray-900">
                {item.price > 0 ? formatPrice(item.price, item.currency) : "Prix en cours de mise a jour"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {data.length > visibleCount ? (
        <Button variant="secondary" onClick={() => setVisibleCount((count) => count + BATCH_SIZE)}>
          Afficher plus de resultats
        </Button>
      ) : null}
    </div>
  );
}
