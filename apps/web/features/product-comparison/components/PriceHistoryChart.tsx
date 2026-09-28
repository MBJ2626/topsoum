"use client";

import dynamic from "next/dynamic";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";

export interface PricePoint {
  recordedAt: string;
  price: number;
}

interface PriceHistoryChartProps {
  state: AsyncState<PricePoint[]>;
  currency?: string;
  onRetry: () => void;
}

function ChartSkeleton() {
  return (
    <div className="h-48 w-full animate-pulse rounded-card bg-gray-100">
      <div className="flex h-full items-end gap-2 p-4">
        {[40, 65, 50, 80, 60, 90].map((height, index) => (
          <div key={index} className="flex-1 rounded-t bg-gray-200" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

// Recharts (~100 Ko) hors du bundle initial de la fiche produit : le graphique
// est sous la ligne de flottaison et souvent vide (historique trop court).
const PriceHistoryLineChart = dynamic(() => import("./PriceHistoryLineChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function PriceHistoryChart({ state, currency = "TND", onRetry }: PriceHistoryChartProps) {
  if (state.status === "loading") {
    return <ChartSkeleton />;
  }

  if (state.status === "error") {
    return <ErrorState message="Historique de prix indisponible." onRetry={onRetry} />;
  }

  const { data } = state;

  if (data.length < 2) {
    return (
      <p className="rounded-card border border-gray-200 p-4 text-sm text-gray-500">
        Pas encore assez de donnees pour afficher l&apos;historique de prix.
      </p>
    );
  }

  return <PriceHistoryLineChart data={data} currency={currency} />;
}
