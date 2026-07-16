"use client";

import { useMemo, useState } from "react";

import { fromQuery } from "@/components/ui/async-state";
import { FavoriteToggle } from "@/features/favorites/components/FavoriteToggle";
import { OfferList } from "@/features/product-comparison/components/OfferList";
import { useProductDetail } from "@/features/product-comparison/hooks/useProductDetail";
import { toBestDealCardData, toOfferRows } from "@/features/product-comparison/lib/map-product-detail";
import { BestDealCard } from "@/features/product-listing/components/BestDealCard";
import { FilterPanel, type FilterValues } from "@/features/product-listing/components/FilterPanel";
import { useProductSearch } from "@/features/product-listing/hooks/useProductSearch";
import { useOfferClick } from "@/lib/use-offer-click";

interface SearchPageClientProps {
  query: string;
}

const EMPTY_FILTERS: FilterValues = { maxBudget: null, brand: null, ram: null };

export function SearchPageClient({ query }: SearchPageClientProps) {
  const searchQuery = useProductSearch(query);
  const offerClick = useOfferClick();
  const [filterValues, setFilterValues] = useState<FilterValues>(EMPTY_FILTERS);

  const results = searchQuery.status === "success" ? searchQuery.data.results : [];

  // Filtrage 100% client-side (limitation documentee : /products/search ne
  // supporte que q/category/limit/offset cote API - pas de brand/ram/budget).
  const filteredResults = useMemo(
    () =>
      results.filter((result) => {
        if (filterValues.maxBudget != null && result.best_deal.price > filterValues.maxBudget) return false;
        if (filterValues.brand != null && result.brand !== filterValues.brand) return false;
        return true;
      }),
    [results, filterValues],
  );

  // 1er resultat (deja trie par meilleur deal cote API) = reponse dominante.
  const dominant = filteredResults[0] ?? null;
  const productDetailQuery = useProductDetail(dominant?.id ?? "");

  const bestDealState = fromQuery(productDetailQuery, toBestDealCardData);
  const offersState = fromQuery(productDetailQuery, toOfferRows);

  const budgetRange = useMemo(() => {
    const prices = results.map((result) => result.best_deal.price).filter((price) => price > 0);
    return { min: 0, max: prices.length > 0 ? Math.max(...prices) : 0 };
  }, [results]);

  const optionsState = fromQuery(searchQuery, (data) => ({
    brands: Array.from(new Set(data.results.map((result) => result.brand))),
    // RAM indisponible dans la reponse de recherche (pas de specs) : filtre
    // affiche mais sans effet tant que l'API n'expose pas ce champ.
    ramOptions: [] as string[],
  }));

  if (query.trim().length === 0) {
    return <p className="p-6 text-center text-sm text-gray-500">Tape une recherche pour commencer.</p>;
  }

  if (searchQuery.status === "error") {
    return (
      <div className="p-6">
        <p className="mb-3 text-sm text-gray-600">Impossible de charger les resultats.</p>
        <button
          type="button"
          onClick={() => searchQuery.refetch()}
          className="min-h-[44px] rounded-full border border-accent px-4 text-sm font-medium text-accent"
        >
          Reessayer
        </button>
      </div>
    );
  }

  if (searchQuery.status === "success" && results.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-gray-500">
        Aucun produit trouve pour « {query} ». Essaie une autre recherche.
      </p>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <FilterPanel
        optionsState={optionsState}
        values={filterValues}
        budgetRange={budgetRange}
        onChange={setFilterValues}
        onRetryOptions={() => searchQuery.refetch()}
      />

      {searchQuery.status === "success" && filteredResults.length === 0 ? (
        <p className="text-center text-sm text-gray-500">Aucun resultat pour ces filtres.</p>
      ) : (
        <>
          <BestDealCard
            state={bestDealState}
            onRetry={() => productDetailQuery.refetch()}
            onViewOffer={(offerId) => offerClick.mutate(offerId)}
            favoriteSlot={dominant ? <FavoriteToggle productId={dominant.id} initialFavorite={null} /> : undefined}
          />

          <section>
            <h2 className="mb-2 text-sm font-medium text-gray-900">Autres vendeurs</h2>
            <OfferList
              state={offersState}
              onRetry={() => productDetailQuery.refetch()}
              onViewOffer={(offerId) => offerClick.mutate(offerId)}
            />
          </section>
        </>
      )}
    </main>
  );
}
