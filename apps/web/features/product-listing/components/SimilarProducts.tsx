"use client";

import Link from "next/link";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductImage } from "@/components/ui/ProductImage";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { displayPrice } from "@/lib/format";

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

/** Deux rangees sur ordinateur, quatre sur mobile : jamais de defilement coupe. */
const MAX_ITEMS = 8;

// Discret par design (pas de bordure accent) : ne doit jamais concurrencer le
// BestDealCard, seul detenteur de l'accent "meilleur prix" sur la page.
export function SimilarProducts({ state, onRetry }: SimilarProductsProps) {
  if (state.status === "loading") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock key={item} className="h-40" />
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
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 border-t-2 border-gray-900 pt-3 sm:grid-cols-4">
      {data.slice(0, MAX_ITEMS).map((item) => (
        <li key={item.id}>
          <Link href={`/product/${item.id}`} className="-mx-2 flex h-full flex-col gap-1.5 rounded-key p-2 transition-colors hover:bg-gray-50">
            <div className="relative mb-1 h-24 w-full overflow-hidden">
              {item.imageUrl ? (
                <ProductImage src={item.imageUrl} alt={item.productName} sizes="120px" />
              ) : null}
            </div>
            <p className="line-clamp-2 text-xs text-gray-700">{item.productName}</p>
            <p className={`tabular mt-auto text-sm ${item.price > 0 ? "font-medium text-gray-900" : "text-gray-500"}`}>
              {displayPrice(item.price, item.currency)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
