import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { apiFetch } from "@/lib/api-client";
import type { ProductSearchResponse } from "@/lib/api-types";
import { getQueryClient } from "@/lib/get-query-client";

import { SearchPageClient } from "./search-page-client";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function fetchProductSearchServer(query: string): Promise<ProductSearchResponse> {
  const response = await apiFetch(`/products/search?q=${encodeURIComponent(query)}&limit=20`, { auth: false });
  if (!response.ok) {
    throw new Error("La recherche a echoue.");
  }
  return response.json();
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `${q} au meilleur prix — TopSoum` : "Recherche — TopSoum" };
}

// SSR : la recherche (et le detail du resultat dominant) sont fetches ici
// cote serveur pour que le HTML initial contienne deja les resultats (SEO).
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const queryClient = getQueryClient();

  if (q.trim().length > 0) {
    const searchData = await fetchProductSearchServer(q);
    queryClient.setQueryData(["product-search", q], searchData);

    const dominant = searchData.results[0];
    if (dominant) {
      const detailResponse = await apiFetch(`/products/${dominant.id}`, { auth: false });
      if (detailResponse.ok) {
        queryClient.setQueryData(["product", dominant.id], await detailResponse.json());
      }
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchPageClient query={q} />
    </HydrationBoundary>
  );
}
