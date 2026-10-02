"use client";

import { useId, useState, type FocusEvent, type KeyboardEvent } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { SearchIcon } from "@/components/ui/icons";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { displayPrice } from "@/lib/format";
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

// Combobox ARIA : le focus reste dans le champ, fleches haut/bas pour parcourir
// les suggestions, Entree pour choisir, Echap pour fermer.
export function SearchBar({
  placeholder = "iPhone 15, PC portable, TV 55 pouces...",
  initialValue = "",
  size = "hero",
  onSubmit,
  onSuggestionSelect,
}: SearchBarProps) {
  const inputId = useId();
  const listboxId = useId();
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value, 300);
  const { status, data, refetch } = useSearchSuggestions(debouncedValue);

  const isHero = size === "hero";
  const showDropdown = isOpen && debouncedValue.trim().length >= 2 && debouncedValue !== initialValue;
  const suggestions = showDropdown && status === "success" ? data.results : [];
  const activeSuggestion = suggestions[activeIndex];
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Le tiroir reste ouvert tant que le focus reste dans la recherche (bouton, "Reessayer").
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Tiroir ferme : Echap garde son effet natif (vider le champ type="search").
    if (event.key === "Escape" && showDropdown) {
      event.preventDefault();
      close();
      return;
    }
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      close();
      onSuggestionSelect?.(activeSuggestion.id);
    }
  }

  return (
    <div className="relative w-full" onBlur={handleBlur}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          close();
          onSubmit?.(value.trim());
        }}
        className={`flex items-stretch gap-1.5 rounded-card border bg-white transition-colors focus-within:border-accent has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${
          isHero ? "border-field p-1.5" : "border-field p-1"
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
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeSuggestion ? optionId(activeIndex) : undefined}
            value={value}
            placeholder={placeholder}
            onChange={(event) => {
              setValue(event.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            // L'anneau de focus est porte par la coque du champ (has-[input:focus-visible]).
            className={`w-full min-w-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none ${
              isHero ? "min-h-[48px] text-base sm:text-lg" : "min-h-[44px] text-base"
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
              : "min-h-[44px] min-w-[44px] px-3 text-sm text-white bg-gray-900 hover:bg-gray-800"
          }`}
        >
          {isHero ? "Chercher" : <SearchIcon size={18} className="mx-auto" />}
        </button>
      </form>

      {showDropdown ? (
        // preventDefault au mousedown : un clic dans le tiroir ne vole pas le focus du champ.
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="animate-tray absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-card border border-gray-200 bg-white p-2 shadow-[0_12px_32px_-12px_rgba(21,23,28,0.18)]"
        >
          {status === "pending" ? (
            <div className="flex flex-col gap-3 p-2">
              <SkeletonLine className="w-3/4" />
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="w-2/3" />
            </div>
          ) : status === "error" ? (
            <ErrorState message="Impossible de charger les suggestions." onRetry={() => refetch()} />
          ) : data.results.length === 0 ? (
            <p role="status" className="p-3 text-sm text-gray-500">
              Aucun produit trouvé pour « {debouncedValue} ».
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Suggestions">
              {data.results.map((result, index) => (
                <li
                  key={result.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                    close();
                    onSuggestionSelect?.(result.id);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-key px-3 py-2 transition-colors ${
                    index === activeIndex ? "bg-gray-50" : ""
                  }`}
                >
                  <span className="line-clamp-1 min-w-0 text-sm text-gray-900">{productDisplayName(result)}</span>
                  <span
                    className={`tabular flex-none text-sm ${
                      Number(result.best_deal.price) > 0 ? "font-medium text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {displayPrice(result.best_deal.price, result.best_deal.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
