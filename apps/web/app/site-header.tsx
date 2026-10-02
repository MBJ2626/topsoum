"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StarIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { SearchBar } from "@/features/search/components/SearchBar";

function HeaderSearch() {
  const router = useRouter();
  const query = useSearchParams().get("q") ?? "";

  return (
    <SearchBar
      key={query}
      size="compact"
      initialValue={query}
      placeholder="Rechercher un produit"
      onSubmit={(next) => {
        if (next.length > 0) router.push(`/search?q=${encodeURIComponent(next)}`);
      }}
      onSuggestionSelect={(productId) => router.push(`/product/${productId}`)}
    />
  );
}

// En-tete des pages internes : marque + recherche toujours a portee de pouce,
// et l'entree discrete vers les favoris (connexion si besoin). Absent de
// l'accueil, dont la seule action est deja la recherche.
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-gray-100">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2 sm:gap-5">
        <Wordmark compact />
        <div className="min-w-0 flex-1">
          <Suspense fallback={<SearchBar size="compact" placeholder="Rechercher un produit" />}>
            <HeaderSearch />
          </Suspense>
        </div>
        <Link
          href="/favorites"
          aria-label="Mes favoris"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-key border border-gray-300 bg-white text-gray-900 transition-[border-color,background-color,transform] duration-150 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
        >
          <StarIcon size={20} />
        </Link>
      </div>
    </header>
  );
}
