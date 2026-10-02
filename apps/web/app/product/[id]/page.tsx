import { cache } from "react";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { apiFetch } from "@/lib/api-client";
import type { ProductDetailResponse } from "@/lib/api-types";
import { loadFavoriteContext } from "@/lib/favorites-server";
import { formatPrice } from "@/lib/format";
import { getQueryClient } from "@/lib/get-query-client";
import { JsonLd, productJsonLd } from "@/lib/json-ld";
import { productDisplayName } from "@/lib/product-name";
import { BASE_OPEN_GRAPH } from "@/lib/site";

import { ProductPageClient } from "./product-page-client";

interface ProductPageParams {
  params: Promise<{ id: string }>;
}

// Appel direct (pas via queryClient.prefetchQuery) : prefetchQuery avale les
// erreurs dans le cache au lieu de les laisser remonter, ce qui casserait le
// mecanisme notFound() de Next.js (il a besoin de se propager tel quel).
// cache() : generateMetadata et la page partagent un seul appel API par requete.
const fetchProductDetailServer = cache(async (id: string): Promise<ProductDetailResponse> => {
  const response = await apiFetch(`/products/${id}`, { auth: false });
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error("Impossible de charger le produit.");
  }
  return response.json();
});

/** Extrait Google : prix le plus bas, vendeur et nombre de revendeurs. Jamais de prix douteux (<= 0). */
function productDescription(detail: ProductDetailResponse): string {
  const name = productDisplayName(detail);
  const price = Number(detail.best_deal.price);
  const vendorCount = detail.offers.length;
  const where = vendorCount > 1 ? `chez ${vendorCount} revendeurs en Tunisie` : `chez ${detail.best_deal.vendor_name}`;
  const from = price > 0 ? ` : à partir de ${formatPrice(price, detail.best_deal.currency)} chez ${detail.best_deal.vendor_name}` : "";
  return `Comparez le prix de ${name} ${where}${from}. Historique des prix et disponibilité.`;
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { id } = await params;
  const detail = await fetchProductDetailServer(id);
  const title = `${productDisplayName(detail)} au meilleur prix`;
  const description = productDescription(detail);
  const url = `/product/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      title,
      description,
      url,
      images: detail.image_url ? [{ url: detail.image_url, alt: productDisplayName(detail) }] : undefined,
    },
    twitter: { card: detail.image_url ? "summary_large_image" : "summary" },
  };
}

export default async function ProductPage({ params }: ProductPageParams) {
  const { id } = await params;

  const detail = await fetchProductDetailServer(id);
  const favoriteContext = await loadFavoriteContext();

  const queryClient = getQueryClient();
  queryClient.setQueryData(["product", id], detail);
  const structuredData = productJsonLd(detail);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <ProductPageClient
        productId={id}
        isAuthenticated={favoriteContext.isAuthenticated}
        initialFavorite={favoriteContext.favoritesByProduct[id] ?? null}
      />
    </HydrationBoundary>
  );
}
