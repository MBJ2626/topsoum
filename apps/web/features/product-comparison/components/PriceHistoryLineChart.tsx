"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice } from "@/lib/format";
import { ACCENT_COLOR } from "@/lib/theme";

import type { PricePoint } from "./PriceHistoryChart";

// Isole de PriceHistoryChart pour etre charge a la demande (next/dynamic) :
// Recharts pese ~100 Ko et ne sert que quand il y a une courbe a tracer.
export default function PriceHistoryLineChart({ data, currency }: { data: PricePoint[]; currency: string }) {
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
