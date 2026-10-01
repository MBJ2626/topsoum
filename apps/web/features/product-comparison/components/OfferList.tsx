"use client";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowUpRightIcon } from "@/components/ui/icons";
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

// Etiquette laterale imprimee : filet d'encre 2 px en tete, filets fins entre
// les lignes, prix alignes a droite en chiffres tabulaires.
export function OfferList({ state, onRetry, onViewOffer }: OfferListProps) {
  if (state.status === "loading") {
    return (
      <ul className="divide-y divide-gray-200 border-t-2 border-gray-900">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex items-center justify-between gap-4 py-4">
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
    return (
      <p className="border-t-2 border-gray-900 pt-3 text-sm text-gray-500">
        Aucune autre offre disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="border-t-2 border-gray-900">
      <div className="flex justify-between py-2 text-xs text-gray-500">
        <span>Revendeur</span>
        <span>Prix</span>
      </div>
      <ul className="divide-y divide-gray-200 border-t border-gray-200">
        {data.map((offer) => (
          <li
            key={offer.offerId}
            data-testid="offer-row"
            className="flex min-h-[44px] items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{offer.vendorName}</p>
              {offer.stockStatus === "out_of_stock" ? (
                <p className="text-xs text-gray-500">Rupture de stock</p>
              ) : offer.shippingCost != null ? (
                <p className="tabular text-xs text-gray-500">+ {formatPrice(offer.shippingCost, offer.currency)} livraison</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`tabular text-end text-sm font-medium ${offer.price > 0 ? "text-gray-900" : "text-gray-500"}`}
              >
                {offer.price > 0 ? formatPrice(offer.price, offer.currency) : "Prix en cours de mise à jour"}
              </span>
              <Button
                data-testid="offer-row-view-offer"
                variant="secondary"
                className="px-3"
                aria-label={`Voir l'offre chez ${offer.vendorName}`}
                onClick={() => {
                  onViewOffer?.(offer.offerId);
                  window.open(offer.url, "_blank", "noopener,noreferrer");
                }}
              >
                <span className="hidden sm:inline">Voir l&apos;offre</span>
                <ArrowUpRightIcon size={18} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
