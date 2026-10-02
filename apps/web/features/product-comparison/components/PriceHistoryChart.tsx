"use client";

import dynamic from "next/dynamic";

import type { AsyncState } from "@/components/ui/async-state";
import { formatPrice } from "@/lib/format";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock } from "@/components/ui/Skeleton";

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
  return <SkeletonBlock className="h-48 w-full" />;
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

  const times = data.map((point) => new Date(point.recordedAt).getTime());
  const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;

  // Moins de 2 jours de suivi : une courbe serait trompeuse (axe d'une seule
  // date). On dit les faits en une ligne a la place.
  if (data.length < 2 || spanDays < 2) {
    if (data.length === 0) {
      return <p className="text-sm text-gray-500">Pas encore de prix enregistré pour ce produit.</p>;
    }
    const prices = data.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const since = new Date(Math.min(...times)).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    return (
      <p className="tabular text-sm text-gray-600">
        Meilleur prix suivi depuis le {since} :{" "}
        {min === max
          ? `stable à ${formatPrice(min, currency)}.`
          : `entre ${formatPrice(min, currency)} et ${formatPrice(max, currency)}.`}{" "}
        La courbe apparaîtra après quelques jours de relevés.
      </p>
    );
  }

  return <PriceHistoryLineChart data={data} currency={currency} />;
}
