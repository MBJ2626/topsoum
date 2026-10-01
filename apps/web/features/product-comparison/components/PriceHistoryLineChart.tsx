"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatPrice } from "@/lib/format";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_LINE_COLOR } from "@/lib/theme";

import type { PricePoint } from "./PriceHistoryChart";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** Graduations rondes et regulieres (pas 1/2/5 x 10^n) encadrant les prix. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min || Math.max(max * 0.1, 1);
  const raw = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw;
  const low = Math.floor(min / step) * step;
  const high = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = low; value <= high + step / 2; value += step) ticks.push(Math.round(value));
  return ticks;
}

// Isole de PriceHistoryChart pour etre charge a la demande (next/dynamic) :
// Recharts pese ~100 Ko et ne sert que quand il y a une courbe a tracer.
export default function PriceHistoryLineChart({ data, currency }: { data: PricePoint[]; currency: string }) {
  // Axe temporel reel : la courbe couvre toute la largeur, une date par graduation.
  const chartData = data
    .map((point) => ({ t: new Date(point.recordedAt).getTime(), price: point.price }))
    .sort((a, b) => a.t - b.t);
  const prices = chartData.map((point) => point.price);
  const ticks = niceTicks(Math.min(...prices), Math.max(...prices));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) => new Date(value).toLocaleDateString("fr-FR", DATE_FORMAT)}
            tick={{ fontSize: 12, fill: CHART_AXIS_COLOR, fontFamily: "inherit" }}
            stroke={CHART_GRID_COLOR}
            tickLine={false}
            tickMargin={8}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 12, fill: CHART_AXIS_COLOR, fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            width={56}
            ticks={ticks}
            domain={[ticks[0], ticks[ticks.length - 1]]}
            tickFormatter={(value: number) => value.toLocaleString("fr-FR")}
          />
          <Tooltip
            labelFormatter={(value) => new Date(Number(value)).toLocaleDateString("fr-FR", DATE_FORMAT)}
            formatter={(value) => formatPrice(Number(value), currency)}
            contentStyle={{ borderRadius: 12, border: `1px solid ${CHART_GRID_COLOR}`, fontVariantNumeric: "tabular-nums" }}
            cursor={{ stroke: CHART_GRID_COLOR }}
          />
          <Line type="stepAfter" dataKey="price" stroke={CHART_LINE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
