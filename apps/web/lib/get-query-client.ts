import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

import { QUERY_DEFAULTS } from "@/lib/query-retry";

// Un QueryClient par requete serveur (React.cache dedoublonne dans le meme
// rendu), utilise pour prefetch + dehydrate/HydrationBoundary dans les pages
// Server Components. Memes defauts que app/providers.tsx cote client.
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: QUERY_DEFAULTS,
  });
}

export const getQueryClient = cache(makeQueryClient);
