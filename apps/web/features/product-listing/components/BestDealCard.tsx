"use client";

import type { ReactNode } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";
import { computeDiscountPercent, formatPrice } from "@/lib/format";

export interface BestDealCardData {
  productName: string;
  imageUrl: string | null;
  vendorName: string;
  offerId: string;
  price: number;
  currency: string;
  averagePrice: number | null;
  offerUrl: string;
}

interface BestDealCardProps {
  state: AsyncState<BestDealCardData>;
  onRetry: () => void;
  onViewOffer?: (offerId: string) => void;
  /** Slot pour <FavoriteToggle /> : product-listing ne doit jamais importer favorites directement. */
  favoriteSlot?: ReactNode;
}

export function BestDealCard({ state, onRetry, onViewOffer, favoriteSlot }: BestDealCardProps) {
  if (state.status === "loading") {
    return (
      <div className="rounded-card border-2 border-gray-100 p-4">
        <SkeletonBlock className="mb-4 h-40 w-full" />
        <SkeletonLine className="mb-2 w-3/4" />
        <SkeletonLine className="mb-4 w-1/3" />
        <SkeletonLine className="mb-4 h-8 w-1/2" />
        <SkeletonBlock className="h-11 w-full rounded-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger le meilleur prix." onRetry={onRetry} />;
  }

  const { data } = state;
  const discount = computeDiscountPercent(data.price, data.averagePrice);

  return (
    <div className="relative rounded-card border-2 border-accent p-4">
      <span className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        Meilleur prix
      </span>

      <div className="mb-4 h-40 w-full overflow-hidden rounded-lg bg-gray-50">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- domaines vendeurs multiples et dynamiques, non listables dans next.config
          <img src={data.imageUrl} alt={data.productName} loading="lazy" className="h-full w-full object-contain" />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-medium text-gray-900">{data.productName}</h3>
          <p className="text-sm text-gray-500">{data.vendorName}</p>
        </div>
        {favoriteSlot}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-medium text-gray-900">{formatPrice(data.price, data.currency)}</span>
      </div>

      {discount !== null ? <p className="mt-1 text-sm font-medium text-green-600">-{discount}% vs moyenne</p> : null}

      <Button
        className="mt-4 w-full"
        onClick={() => {
          onViewOffer?.(data.offerId);
          window.open(data.offerUrl, "_blank", "noopener,noreferrer");
        }}
      >
        Voir l&apos;offre
      </Button>
    </div>
  );
}
