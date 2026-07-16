import type { QueryClient } from "@tanstack/react-query";

// Cache "derniers produits vus" tenu entierement dans React Query (pas de
// localStorage) : setQueryData notifie tout useQuery abonne a cette clef,
// meme sans queryFn/refetch (pattern "cache externe comme state"). Limite
// assumee : ne survit pas a un rechargement complet de la page (memoire
// uniquement) - suffisant pour une version "basique", piste V2 = persistance.
export const RECENTLY_VIEWED_QUERY_KEY = ["recently-viewed"] as const;
const MAX_RECENTLY_VIEWED = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  currency: string;
}

export function pushRecentlyViewed(queryClient: QueryClient, item: RecentlyViewedItem): void {
  queryClient.setQueryData<RecentlyViewedItem[]>(RECENTLY_VIEWED_QUERY_KEY, (current = []) => {
    const withoutDuplicate = current.filter((existing) => existing.id !== item.id);
    return [item, ...withoutDuplicate].slice(0, MAX_RECENTLY_VIEWED);
  });
}
