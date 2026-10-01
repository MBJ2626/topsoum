"use client";

import { useId, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { SearchIcon } from "@/components/ui/icons";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";
import { productDisplayName } from "@/lib/product-name";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { useSearchSuggestions } from "../hooks/useSearchSuggestions";

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
  /** "hero" : grand champ de l'accueil ; "compact" : barre d'en-tete. */
  size?: "hero" | "compact";
  onSubmit?: (query: string) => void;
  onSuggestionSelect?: (productId: string) => void;
}

export function SearchBar({
  placeholder = "iPhone 15, PC portable, TV 55 pouces...",
  initialValue = "",
  size = "hero",
  onSubmit,
  onSuggestionSelect,
}: SearchBarProps) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebouncedValue(value, 300);
  const { status, data, refetch } = useSearchSuggestions(debouncedValue);

  const isHero = size === "hero";
  const showDropdown = isFocused && debouncedValue.trim().length >= 2 && debouncedValue !== initialValue;

  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.(value.trim());
        }}
        className={`flex items-stretch gap-1.5 rounded-card border bg-white p-1.5 transition-colors focus-within:border-accent ${
          isHero ? "border-gray-300" : "border-gray-200"
        }`}
      >
        <label htmlFor={inputId} className="sr-only">
          Rechercher un produit
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 ps-2.5 text-gray-500">
          <SearchIcon size={isHero ? 22 : 18} className="flex-none" />
          <input
            id={inputId}
            data-testid="search-input"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            className={`w-full min-w-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none ${
              isHero ? "min-h-[48px] text-base sm:text-lg" : "min-h-[36px] text-base"
            }`}
          />
        </div>
        <button
          type="submit"
          aria-label="Chercher"
          // Accent uniquement sur l'accueil (action principale de l'ecran) ; dans
          // l'en-tete, touche encre pour ne jamais concurrencer "Voir l'offre".
          className={`flex-none rounded-key font-medium transition-[background-color,transform] duration-150 active:scale-[0.97] ${
            isHero
              ? "min-h-[48px] px-4 text-base text-accent-foreground bg-accent hover:bg-accent-strong sm:px-6"
              : "min-h-[36px] min-w-[44px] px-3 text-sm text-white bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {isHero ? "Chercher" : <SearchIcon size={18} className="mx-auto" />}
        </button>
      </form>

      {showDropdown ? (
        <div className="animate-tray absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-card border border-gray-200 bg-white p-2 shadow-[0_12px_32px_-12px_rgba(21,23,28,0.18)]">
          {status === "pending" ? (
            <div className="flex flex-col gap-3 p-2">
              <SkeletonLine className="w-3/4" />
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="w-2/3" />
            </div>
          ) : status === "error" ? (
            <ErrorState message="Impossible de charger les suggestions." onRetry={() => refetch()} />
          ) : data.results.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">Aucun produit trouvé pour « {debouncedValue} ».</p>
          ) : (
            <ul>
              {data.results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => onSuggestionSelect?.(result.id)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-key px-3 py-2 text-start transition-colors hover:bg-gray-50"
                  >
                    <span className="line-clamp-1 text-sm text-gray-900">{productDisplayName(result)}</span>
                    <span className="tabular flex-none text-sm font-medium text-gray-900">
                      {formatPrice(result.best_deal.price, result.best_deal.currency)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
