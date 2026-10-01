"use client";

import type { ReactNode } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";
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
      <div className="rounded-card border border-gray-200 bg-white p-4 sm:p-6">
        <SkeletonBlock className="mb-5 h-48 w-full" />
        <SkeletonLine className="mb-2 w-3/4" />
        <SkeletonLine className="mb-5 w-1/3" />
        <SkeletonLine className="mb-5 h-9 w-1/2" />
        <SkeletonBlock className="h-[52px] w-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger le meilleur prix." onRetry={onRetry} />;
  }

  const { data } = state;
  const discount = computeDiscountPercent(data.price, data.averagePrice);

  // La reponse : une face de boite, arete accent 2 px et onglet "Meilleur prix"
  // accroche a l'arete comme une languette d'emballage.
  return (
    <article data-testid="best-deal-card" className="relative mt-3 rounded-card border-2 border-accent bg-white p-4 sm:p-6">
      <span className="absolute -top-[13px] start-4 rounded-t-key bg-accent px-3 pb-[3px] pt-1 text-xs font-medium text-accent-foreground sm:start-6">
        Meilleur prix
      </span>

      <div className="relative mb-5 h-48 w-full overflow-hidden sm:h-56">
        {data.imageUrl ? (
          // Plus grand element visible au chargement (LCP) : priorite, jamais lazy.
          // Cadre carre centre : servie a la hauteur du cadre, pas en pleine largeur.
          <ProductImage src={data.imageUrl} alt={data.productName} sizes="224px" priority />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-medium leading-snug text-gray-900">{data.productName}</h3>
          <p className="mt-1 text-sm text-gray-500">chez {data.vendorName}</p>
        </div>
        {favoriteSlot}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-gray-200 pt-4">
        <span className="tabular text-[2.5rem] font-medium leading-none tracking-display text-gray-900">
          {formatPrice(data.price, data.currency)}
        </span>
        {discount !== null ? (
          <span className="text-sm font-medium text-green-700">-{discount}% vs moyenne</span>
        ) : null}
      </div>

      <Button
        data-testid="best-deal-view-offer"
        size="lg"
        className="mt-5 w-full"
        onClick={() => {
          onViewOffer?.(data.offerId);
          window.open(data.offerUrl, "_blank", "noopener,noreferrer");
        }}
      >
        Voir l&apos;offre
        <ArrowUpRightIcon size={18} />
      </Button>
    </article>
  );
}
