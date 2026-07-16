import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { apiFetch } from "@/lib/api-client";
import type { FavoriteListResponse, ProductDetailResponse } from "@/lib/api-types";
import { getQueryClient } from "@/lib/get-query-client";

import { ProductPageClient } from "./product-page-client";

interface ProductPageParams {
  params: Promise<{ id: string }>;
}

// Appel direct (pas via queryClient.prefetchQuery) : prefetchQuery avale les
// erreurs dans le cache au lieu de les laisser remonter, ce qui casserait le
// mecanisme notFound() de Next.js (il a besoin de se propager tel quel).
async function fetchProductDetailServer(id: string): Promise<ProductDetailResponse> {
  const response = await apiFetch(`/products/${id}`, { auth: false });
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error("Impossible de charger le produit.");
  }
  return response.json();
}

interface FavoriteContext {
  isAuthenticated: boolean;
  initialFavorite: { favoriteId: string; priceTracking: boolean } | null;
}

async function loadFavoriteContext(productId: string): Promise<FavoriteContext> {
  const session = await auth();
  if (!session) {
    return { isAuthenticated: false, initialFavorite: null };
  }

  const response = await apiFetch("/favorites");
  if (!response.ok) {
    return { isAuthenticated: true, initialFavorite: null };
  }

  const data: FavoriteListResponse = await response.json();
  const match = data.results.find((favorite) => favorite.product_id === productId);
  return {
    isAuthenticated: true,
    initialFavorite: match ? { favoriteId: match.id, priceTracking: match.price_tracking } : null,
  };
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { id } = await params;
  const detail = await fetchProductDetailServer(id);
  return { title: `${detail.brand} ${detail.model} au meilleur prix — TopSoum` };
}

export default async function ProductPage({ params }: ProductPageParams) {
  const { id } = await params;

  const detail = await fetchProductDetailServer(id);
  const favoriteContext = await loadFavoriteContext(id);

  const queryClient = getQueryClient();
  queryClient.setQueryData(["product", id], detail);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductPageClient
        productId={id}
        isAuthenticated={favoriteContext.isAuthenticated}
        initialFavorite={favoriteContext.initialFavorite}
      />
    </HydrationBoundary>
  );
}
