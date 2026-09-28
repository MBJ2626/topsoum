"use client";

import { useId, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { useSearchSuggestions } from "../hooks/useSearchSuggestions";

interface SearchBarProps {
  placeholder?: string;
  onSubmit?: (query: string) => void;
  onSuggestionSelect?: (productId: string) => void;
}

export function SearchBar({
  placeholder = "iPhone 15, PC portable, TV 55 pouces...",
  onSubmit,
  onSuggestionSelect,
}: SearchBarProps) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebouncedValue(value, 300);
  const { status, data, refetch } = useSearchSuggestions(debouncedValue);

  const showDropdown = isFocused && debouncedValue.trim().length >= 2;

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor={inputId} className="sr-only">
        Rechercher un produit
      </label>
      <input
        id={inputId}
        data-testid="search-input"
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit?.(value.trim());
          }
        }}
        className="min-h-[44px] w-full rounded-full border border-gray-300 px-5 text-base focus:border-accent focus:outline-none"
      />

      {showDropdown ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 rounded-card border border-gray-200 bg-white p-2 shadow-lg">
          {status === "pending" ? (
            <div className="flex flex-col gap-3 p-2">
              <SkeletonLine className="w-3/4" />
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="w-2/3" />
            </div>
          ) : status === "error" ? (
            <ErrorState message="Impossible de charger les suggestions." onRetry={() => refetch()} />
          ) : data.results.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">Aucun produit trouve pour « {debouncedValue} ».</p>
          ) : (
            <ul>
              {data.results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => onSuggestionSelect?.(result.id)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-900">
                      {result.brand} {result.model}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
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
