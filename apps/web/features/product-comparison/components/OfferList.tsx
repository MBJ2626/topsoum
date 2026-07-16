"use client";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";

export interface OfferRow {
  offerId: string;
  vendorName: string;
  price: number;
  currency: string;
  shippingCost: number | null;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  url: string;
}

interface OfferListProps {
  state: AsyncState<OfferRow[]>;
  onRetry: () => void;
  onViewOffer?: (offerId: string) => void;
}

export function OfferList({ state, onRetry, onViewOffer }: OfferListProps) {
  if (state.status === "loading") {
    return (
      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex items-center justify-between gap-4 py-3">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/5" />
          </li>
        ))}
      </ul>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger les autres offres." onRetry={onRetry} />;
  }

  const { data } = state;

  if (data.length === 0) {
    return <p className="py-3 text-sm text-gray-500">Aucune autre offre disponible pour le moment.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 border-t border-gray-100">
      {data.map((offer) => (
        <li key={offer.offerId} className="flex min-h-[44px] items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{offer.vendorName}</p>
            {offer.stockStatus === "out_of_stock" ? (
              <p className="text-xs text-gray-500">Rupture de stock</p>
            ) : offer.shippingCost != null ? (
              <p className="text-xs text-gray-500">+ {formatPrice(offer.shippingCost, offer.currency)} livraison</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              {offer.price > 0 ? formatPrice(offer.price, offer.currency) : "Prix en cours de mise a jour"}
            </span>
            <Button
              variant="secondary"
              className="px-4 text-xs"
              onClick={() => {
                onViewOffer?.(offer.offerId);
                window.open(offer.url, "_blank", "noopener,noreferrer");
              }}
            >
              Voir l&apos;offre
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
