"use client";

import { useRouter } from "next/navigation";

import { SearchBar } from "@/features/search/components/SearchBar";

export function HomeSearchClient() {
  const router = useRouter();

  return (
    <SearchBar
      placeholder="iPhone 15, PC portable…"
      onSubmit={(query) => {
        if (query.length > 0) {
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }
      }}
      onSuggestionSelect={(productId) => router.push(`/product/${productId}`)}
    />
  );
}
