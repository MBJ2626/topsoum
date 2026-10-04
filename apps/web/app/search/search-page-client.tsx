"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";

import { useMemo, useState } from "react";

import { fromQuery } from "@/components/ui/async-state";
import { FavoriteToggle, type FavoriteState } from "@/features/favorites/components/FavoriteToggle";
import { OfferList } from "@/features/product-comparison/components/OfferList";
import { useProductDetail } from "@/features/product-comparison/hooks/useProductDetail";
import { toBestDealCardData, toOfferRows } from "@/features/product-comparison/lib/map-product-detail";
import { BestDealCard } from "@/features/product-listing/components/BestDealCard";
import { FilterPanel, type FilterValues } from "@/features/product-listing/components/FilterPanel";
import { ResultList } from "@/features/product-listing/components/ResultList";
import { useProductSearch, type SearchFilters } from "@/features/product-listing/hooks/useProductSearch";
import { productDisplayName } from "@/lib/product-name";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useOfferClick } from "@/lib/use-offer-click";

interface SearchPageClientProps {
  query: string;
  isAuthenticated: boolean;
  favoritesByProduct: Record<string, FavoriteState>;
}

const EMPTY_FILTERS: FilterValues = { maxBudget: null, brand: null, ram: null };

export function SearchPageClient({ query, isAuthenticated, favoritesByProduct }: SearchPageClientProps) {
  const offerClick = useOfferClick();
  const [filterValues, setFilterValues] = useState<FilterValues>(EMPTY_FILTERS);
  // Le curseur de budget bouge en continu : une seule requete 300 ms apres le dernier mouvement.
  const debouncedBudget = useDebouncedValue(filterValues.maxBudget, 300);

  // Recherche sans filtre (rendue cote serveur) : etat de la page et options des filtres.
  const searchQuery = useProductSearch(query);
  // Recherche filtree par l'API, sur tout le catalogue ; sans filtre actif, meme cache que la precedente.
  const apiFilters: SearchFilters = {
    brand: filterValues.brand,
    ramGb: filterValues.ram != null ? Number(filterValues.ram) : null,
    maxPrice: debouncedBudget,
  };
  const filteredQuery = useProductSearch(query, apiFilters);

  const results = useMemo(
    () => (searchQuery.status === "success" ? searchQuery.data.results : []),
    [searchQuery.status, searchQuery.data],
  );
  const filteredResults = useMemo(
    () => (filteredQuery.status === "success" ? filteredQuery.data.results : []),
    [filteredQuery.status, filteredQuery.data],
  );

  // 1er resultat (deja trie par meilleur deal cote API) = reponse dominante.
  const dominant = filteredResults[0] ?? null;
  const productDetailQuery = useProductDetail(dominant?.id ?? "");

  const bestDealState = fromQuery(productDetailQuery, toBestDealCardData);

  // Les autres produits trouves, sous la reponse dominante : sans cette liste,
  // une recherche large ("iphone") ne montrerait que le moins cher de tous.
  const otherResultsState = fromQuery(filteredQuery, () =>
    filteredResults.slice(1).map((result) => ({
      id: result.id,
      productName: productDisplayName(result),
      imageUrl: result.image_url,
      price: Number(result.best_deal.price),
      currency: result.best_deal.currency,
      vendorName: result.best_deal.vendor_name,
      offersCount: result.offers_count,
    })),
  );
  const offersState = fromQuery(productDetailQuery, toOfferRows);

  const budgetRange = useMemo(() => {
    const prices = results.map((result) => Number(result.best_deal.price)).filter((price) => price > 0);
    return { min: 0, max: prices.length > 0 ? Math.max(...prices) : 0 };
  }, [results]);

  const optionsState = fromQuery(searchQuery, (data) => ({
    brands: Array.from(new Set(data.results.map((result) => result.brand))),
    // RAM connue (specs.ramGb) des produits trouves ; aucune -> filtre masque.
    ramOptions: Array.from(new Set(data.results.flatMap((result) => (result.ram_gb != null ? [result.ram_gb] : []))))
      .sort((a, b) => a - b)
      .map(String),
  }));

  if (query.trim().length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-center text-sm text-gray-500">Tapez une recherche pour commencer.</p>
      </main>
    );
  }

  if (searchQuery.status === "error") {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <ErrorState message="Impossible de charger les résultats." onRetry={() => searchQuery.refetch()} />
      </main>
    );
  }

  if (searchQuery.status === "success" && results.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="rounded-card border border-gray-200 bg-white p-6 text-center">
          <p className="text-base font-medium text-gray-900">Aucun produit trouvé pour « {query} ».</p>
          <p className="mt-1 text-sm text-gray-500">Essayez un autre nom de modèle ou une marque.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4 sm:gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 truncate text-lg font-medium text-gray-900">« {query} »</h1>
        <FilterPanel
          optionsState={optionsState}
          values={filterValues}
          budgetRange={budgetRange}
          onChange={setFilterValues}
          onRetryOptions={() => searchQuery.refetch()}
        />
      </div>

      {filteredQuery.status === "error" ? (
        <ErrorState message="Impossible d'appliquer les filtres." onRetry={() => filteredQuery.refetch()} />
      ) : filteredQuery.status === "success" && filteredResults.length === 0 ? (
        <p className="rounded-card border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Aucun résultat pour ces filtres.
        </p>
      ) : (
        <>
          <BestDealCard
            state={bestDealState}
            onRetry={() => productDetailQuery.refetch()}
            onViewOffer={(offerId) => offerClick.mutate(offerId)}
            favoriteSlot={
              dominant && isAuthenticated ? (
                // key : un filtre qui change la reponse dominante repart de son vrai etat favori.
                <FavoriteToggle
                  key={dominant.id}
                  productId={dominant.id}
                  initialFavorite={favoritesByProduct[dominant.id] ?? null}
                />
              ) : undefined
            }
          />

          <Panel title="Autres vendeurs">
            <OfferList
              state={offersState}
              onRetry={() => productDetailQuery.refetch()}
              onViewOffer={(offerId) => offerClick.mutate(offerId)}
            />
          </Panel>

          {filteredResults.length > 1 ? (
            <Panel
              title="Autres résultats"
              aside={<span className="tabular text-sm text-gray-500">{filteredResults.length - 1}</span>}
            >
              <ResultList state={otherResultsState} onRetry={() => searchQuery.refetch()} />
            </Panel>
          ) : null}
        </>
      )}
    </main>
  );
}
