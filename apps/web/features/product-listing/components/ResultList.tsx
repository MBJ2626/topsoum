"use client";

import Link from "next/link";
import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LINK_PENDING_CLASS, LinkPending } from "@/components/ui/LinkPending";
import { ProductImage } from "@/components/ui/ProductImage";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";
import { displayPrice } from "@/lib/format";

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
      <ul className="divide-y divide-gray-200">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex items-center gap-3 py-3">
            <SkeletonBlock className="h-14 w-14 flex-none" />
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
        message="Impossible de charger les autres résultats."
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
      <ul className="divide-y divide-gray-200">
        {data.slice(0, visibleCount).map((item) => (
          <li key={item.id} data-testid="result-row">
            <Link
              href={`/product/${item.id}`}
              className={`-mx-2 flex min-h-[44px] items-center gap-3 rounded-key px-2 py-3 transition-colors hover:bg-gray-50 ${LINK_PENDING_CLASS}`}
            >
              <LinkPending />
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-key">
                {item.imageUrl ? (
                  <ProductImage src={item.imageUrl} alt={item.productName} sizes="56px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {item.offersCount > 1 ? `${item.offersCount} vendeurs` : item.vendorName}
                </p>
              </div>
              <span className="tabular flex-none text-end text-sm font-medium text-gray-900">
                {displayPrice(item.price, item.currency)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {data.length > visibleCount ? (
        <Button variant="secondary" onClick={() => setVisibleCount((count) => count + BATCH_SIZE)}>
          Afficher plus de résultats
        </Button>
      ) : null}
    </div>
  );
}
