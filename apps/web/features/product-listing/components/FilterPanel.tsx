"use client";

import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SlidersIcon } from "@/components/ui/icons";
import { SkeletonLine } from "@/components/ui/Skeleton";

export interface FilterOptions {
  brands: string[];
  ramOptions: string[];
}

export interface FilterValues {
  maxBudget: number | null;
  brand: string | null;
  ram: string | null;
}

interface FilterPanelProps {
  optionsState: AsyncState<FilterOptions>;
  values: FilterValues;
  budgetRange: { min: number; max: number };
  onChange: (values: FilterValues) => void;
  onRetryOptions: () => void;
}

export function FilterPanel({ optionsState, values, budgetRange, onChange, onRetryOptions }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = [values.maxBudget, values.brand, values.ram].filter((value) => value != null).length;

  // "contents" : le bouton et le panneau deviennent des enfants directs de la
  // rangee parente (flex-wrap), le panneau ouvert passe a la ligne en pleine largeur.
  return (
    <div className="contents">
      <Button type="button" variant="secondary" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}>
        <SlidersIcon size={18} />
        Filtres
        {activeCount > 0 ? (
          <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-accent-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="animate-tray basis-full rounded-card border border-gray-200 bg-white p-4 sm:p-6">
          {optionsState.status === "loading" ? (
            <div className="flex flex-col gap-3">
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="w-2/3" />
              <SkeletonLine className="w-1/3" />
            </div>
          ) : optionsState.status === "error" ? (
            <ErrorState message="Impossible de charger les filtres." onRetry={onRetryOptions} />
          ) : (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                <span className="flex justify-between">
                  Budget max
                  <span className="tabular font-medium text-gray-900">{values.maxBudget ?? budgetRange.max} TND</span>
                </span>
                <input
                  type="range"
                  min={budgetRange.min}
                  max={budgetRange.max}
                  value={values.maxBudget ?? budgetRange.max}
                  onChange={(event) => onChange({ ...values, maxBudget: Number(event.target.value) })}
                  className="h-11 w-full accent-accent"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Marque
                <select
                  value={values.brand ?? ""}
                  onChange={(event) => onChange({ ...values, brand: event.target.value || null })}
                  className="min-h-[44px] rounded-key border border-field bg-white px-3 text-gray-900"
                >
                  <option value="">Toutes les marques</option>
                  {optionsState.data.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              {/* Masque tant que l'API n'expose pas la RAM : jamais de filtre sans effet. */}
              {optionsState.data.ramOptions.length > 0 ? (
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  RAM
                  <select
                    value={values.ram ?? ""}
                    onChange={(event) => onChange({ ...values, ram: event.target.value || null })}
                    className="min-h-[44px] rounded-key border border-field bg-white px-3 text-gray-900"
                  >
                    <option value="">Toutes</option>
                    {optionsState.data.ramOptions.map((ram) => (
                      <option key={ram} value={ram}>
                        {ram}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
