"use client";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";
import type { AdminStatsResponse } from "@/lib/api-types";

interface GlobalStatsBarProps {
  state: AsyncState<AdminStatsResponse>;
  onRetry: () => void;
}

function formatLastUpdated(value: string | null): string {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Tunis" }).format(new Date(value));
}

export function GlobalStatsBar({ state, onRetry }: GlobalStatsBarProps) {
  if (state.status === "loading") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((tile) => (
          <div key={tile} className="rounded-card border border-gray-200 bg-white p-4">
            <SkeletonLine className="mb-2 w-1/2" />
            <SkeletonBlock className="h-6 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger les statistiques globales." onRetry={onRetry} />;
  }

  const { data } = state;
  const tiles = [
    { label: "Produits", value: data.total_products.toLocaleString("fr-FR") },
    { label: "Offres", value: data.total_offers.toLocaleString("fr-FR") },
    { label: "Dernière mise à jour", value: formatLastUpdated(data.last_updated_at) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-card border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{tile.label}</p>
          <p className="mt-1 text-xl font-medium text-gray-900">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
