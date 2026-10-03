"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { usePendingNavigation } from "@/lib/use-pending-navigation";

export function HomeSearchClient() {
  const { pending, navigate } = usePendingNavigation();

  return (
    <SearchBar
      placeholder="iPhone 15, PC portable…"
      pending={pending}
      onSubmit={(query) => {
        if (query.length > 0) {
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }
      }}
      onSuggestionSelect={(productId) => navigate(`/product/${productId}`)}
    />
  );
}
