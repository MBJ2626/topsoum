"use client";

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
import { useOfferClick } from "@/lib/use-offer-click";

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

  useEffect(() => {
    if (productQuery.status !== "success") return;
    const detail = productQuery.data;
    pushRecentlyViewed(queryClient, {
      id: detail.id,
      name: detail.canonical_name,
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
        productName: `${result.brand} ${result.model}`,
        imageUrl: result.image_url,
        price: result.best_deal.price,
        currency: result.best_deal.currency,
      })),
  );

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 p-4">
      <BestDealCard
        state={bestDealState}
        onRetry={() => productQuery.refetch()}
        onViewOffer={(offerId) => offerClick.mutate(offerId)}
        favoriteSlot={
          isAuthenticated ? <FavoriteToggle productId={productId} initialFavorite={initialFavorite} /> : undefined
        }
      />

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-900">Historique de prix</h2>
        <PriceHistoryChart state={historyState} onRetry={() => productQuery.refetch()} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-900">Autres vendeurs</h2>
        <OfferList
          state={offersState}
          onRetry={() => productQuery.refetch()}
          onViewOffer={(offerId) => offerClick.mutate(offerId)}
        />
      </section>

      {productQuery.status === "success" ? (
        <section>
          <button
            type="button"
            onClick={() => setShowSpecs((open) => !open)}
            aria-expanded={showSpecs}
            className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-gray-900"
          >
            Caracteristiques {showSpecs ? "▲" : "▼"}
          </button>
          {showSpecs ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
              {Object.entries(productQuery.data.specs).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-gray-500">{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-900">Produits similaires</h2>
        <SimilarProducts state={similarState} onRetry={() => similarQuery.refetch()} />
      </section>
    </main>
  );
}
