"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatPrice } from "@/lib/format";
import { ACCENT_COLOR } from "@/lib/theme";

export interface PricePoint {
  recordedAt: string;
  price: number;
}

interface PriceHistoryChartProps {
  state: AsyncState<PricePoint[]>;
  currency?: string;
  onRetry: () => void;
}

export function PriceHistoryChart({ state, currency = "TND", onRetry }: PriceHistoryChartProps) {
  if (state.status === "loading") {
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

  const chartData = data.map((point) => ({
    date: new Date(point.recordedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    price: point.price,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" width={64} />
          <Tooltip formatter={(value) => formatPrice(Number(value), currency)} />
          <Line type="monotone" dataKey="price" stroke={ACCENT_COLOR} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
