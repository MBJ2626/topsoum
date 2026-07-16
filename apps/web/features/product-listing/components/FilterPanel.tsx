"use client";

import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
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

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-900"
      >
        Filtres
        {activeCount > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
            {activeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-card border border-gray-200 p-4">
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
                Budget max : {values.maxBudget ?? budgetRange.max} TND
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
                  className="min-h-[44px] rounded-lg border border-gray-300 px-3"
                >
                  <option value="">Toutes les marques</option>
                  {optionsState.data.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-gray-700">
                RAM
                <select
                  value={values.ram ?? ""}
                  onChange={(event) => onChange({ ...values, ram: event.target.value || null })}
                  className="min-h-[44px] rounded-lg border border-gray-300 px-3"
                >
                  <option value="">Toutes</option>
                  {optionsState.data.ramOptions.map((ram) => (
                    <option key={ram} value={ram}>
                      {ram}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
