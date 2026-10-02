"use client";

import { ChevronDownIcon } from "@/components/ui/icons";
import { Panel } from "@/components/ui/Panel";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { fromQuery } from "@/components/ui/async-state";
import { FavoriteToggle } from "@/features/favorites/components/FavoriteToggle";
import { OfferList } from "@/features/product-comparison/components/OfferList";
import { PriceHistoryChart } from "@/features/product-comparison/components/PriceHistoryChart";
import { useProductDetail } from "@/features/product-comparison/hooks/useProductDetail";
import {
  toBestDealCardData,
  toOfferRows,
  toPriceHistoryPoints,
} from "@/features/product-comparison/lib/map-product-detail";
import { BestDealCard } from "@/features/product-listing/components/BestDealCard";
import { SimilarProducts } from "@/features/product-listing/components/SimilarProducts";
import { useSimilarProducts } from "@/features/product-listing/hooks/useSimilarProducts";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import { productDisplayName } from "@/lib/product-name";
import { useOfferClick } from "@/lib/use-offer-click";
import { useRecordProductView } from "@/lib/use-record-view";

interface ProductPageClientProps {
  productId: string;
  isAuthenticated: boolean;
  initialFavorite: { favoriteId: string; priceTracking: boolean } | null;
}

export function ProductPageClient({ productId, isAuthenticated, initialFavorite }: ProductPageClientProps) {
  const productQuery = useProductDetail(productId);
  const offerClick = useOfferClick();
  const queryClient = useQueryClient();
  const [showSpecs, setShowSpecs] = useState(false);

  useRecordProductView(productId, productQuery.status === "success");

  useEffect(() => {
    if (productQuery.status !== "success") return;
    const detail = productQuery.data;
    pushRecentlyViewed(queryClient, {
      id: detail.id,
      name: productDisplayName(detail),
      imageUrl: detail.image_url,
      price: detail.best_deal.price,
      currency: detail.best_deal.currency,
    });
  }, [productQuery.status, productQuery.data, queryClient]);

  const bestDealState = fromQuery(productQuery, toBestDealCardData);
  const offersState = fromQuery(productQuery, toOfferRows);
  const historyState = fromQuery(productQuery, toPriceHistoryPoints);

  const category = productQuery.status === "success" ? productQuery.data.category : "";
  const similarQuery = useSimilarProducts(category);
  const similarState = fromQuery(similarQuery, (data) =>
    data.results
      .filter((result) => result.id !== productId)
      .map((result) => ({
        id: result.id,
        productName: productDisplayName(result),
        imageUrl: result.image_url,
        price: Number(result.best_deal.price),
        currency: result.best_deal.currency,
      })),
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4 sm:gap-5">
      <BestDealCard
        headingLevel="h1"
        state={bestDealState}
        onRetry={() => productQuery.refetch()}
        onViewOffer={(offerId) => offerClick.mutate(offerId)}
        favoriteSlot={
          isAuthenticated ? <FavoriteToggle productId={productId} initialFavorite={initialFavorite} /> : undefined
        }
      />

      <Panel title="Historique du meilleur prix">
        <PriceHistoryChart state={historyState} onRetry={() => productQuery.refetch()} />
      </Panel>

      <Panel title="Autres vendeurs">
        <OfferList
          state={offersState}
          onRetry={() => productQuery.refetch()}
          onViewOffer={(offerId) => offerClick.mutate(offerId)}
        />
      </Panel>

      {productQuery.status === "success" ? (
        <section className="rounded-card border border-gray-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setShowSpecs((open) => !open)}
            aria-expanded={showSpecs}
            className="flex min-h-[56px] w-full items-center justify-between gap-2 text-base font-medium text-gray-900"
          >
            Caractéristiques
            <ChevronDownIcon
              size={20}
              className={`text-gray-500 transition-transform duration-200 ${showSpecs ? "rotate-180" : ""}`}
            />
          </button>
          {showSpecs ? (
            <dl className="mb-4 divide-y divide-gray-200 border-t-2 border-gray-900 text-sm">
              {Object.entries(productQuery.data.specs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 py-2.5">
                  <dt className="min-w-0 break-words text-gray-500">{key}</dt>
                  <dd className="min-w-0 break-words text-gray-900">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <Panel title="Produits similaires">
        <SimilarProducts state={similarState} onRetry={() => similarQuery.refetch()} />
      </Panel>
    </main>
  );
}
