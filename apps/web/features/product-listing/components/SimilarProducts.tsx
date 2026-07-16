"use client";

import Link from "next/link";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";

export interface SimilarProductItem {
  id: string;
  productName: string;
  imageUrl: string | null;
  price: number;
  currency: string;
}

interface SimilarProductsProps {
  state: AsyncState<SimilarProductItem[]>;
  onRetry: () => void;
}

// Discret par design (pas de bordure accent) : ne doit jamais concurrencer le
// BestDealCard, seul detenteur de l'accent "meilleur prix" sur la page.
export function SimilarProducts({ state, onRetry }: SimilarProductsProps) {
  if (state.status === "loading") {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="h-32 w-28 flex-none" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger les produits similaires." onRetry={onRetry} />;
  }

  const { data } = state;

  if (data.length === 0) {
    return null;
  }

  return (
    <ul className="flex gap-3 overflow-x-auto pb-2">
      {data.map((item) => (
        <li key={item.id} className="w-28 flex-none">
          <Link href={`/product/${item.id}`} className="flex flex-col gap-1 rounded-card border border-gray-100 p-2">
            <div className="h-20 w-full overflow-hidden rounded-lg bg-gray-50">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- domaines vendeurs multiples et dynamiques
                <img src={item.imageUrl} alt={item.productName} loading="lazy" className="h-full w-full object-contain" />
              ) : null}
            </div>
            <p className="truncate text-xs text-gray-700">{item.productName}</p>
            <p className="text-xs font-medium text-gray-900">{formatPrice(item.price, item.currency)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
