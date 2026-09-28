import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { apiFetch } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";

import { FavoritesPageClient } from "./favorites-page-client";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false, follow: false } };

// Protection isolee a cette page (pas d'extension de middleware.ts) : le
// middleware existant applique la logique mono-admin (isAdmin !== true ->
// redirect "/") a tout chemin matche, ce qui bloquerait les utilisateurs non-
// admin si on y ajoutait /favorites.
export default async function FavoritesPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/favorites");
  }

  const queryClient = getQueryClient();
  const response = await apiFetch("/favorites");
  if (response.ok) {
    queryClient.setQueryData(["favorites"], await response.json());
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FavoritesPageClient />
    </HydrationBoundary>
  );
}
