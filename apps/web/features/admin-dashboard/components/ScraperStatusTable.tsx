"use client";

import type { AsyncState } from "@/components/ui/async-state";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import type { ScraperRunStatus, ScraperVendorStatus } from "@/lib/api-types";

interface ScraperStatusTableProps {
  state: AsyncState<ScraperVendorStatus[]>;
  onRetry: () => void;
}

const STATUS_LABELS: Record<ScraperRunStatus, string> = {
  success: "Succes",
  partial: "Partiel",
  failed: "Echec",
  running: "En cours",
};

function formatDate(value: string | null): string {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ScraperStatusTable({ state, onRetry }: ScraperStatusTableProps) {
  if (state.status === "loading") {
    return (
      <ul className="divide-y divide-gray-100 rounded-card border border-gray-100">
        {[0, 1, 2, 3].map((row) => (
          <li key={row} className="flex flex-col gap-2 p-4">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/2" />
          </li>
        ))}
      </ul>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger le statut des scrapers." onRetry={onRetry} />;
  }

  const { data } = state;

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Aucun scraper enregistre pour le moment.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-card border border-gray-100">
      {data.map((vendor) => (
        <li key={vendor.vendor_name} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">{vendor.vendor_name}</p>
            <span
              className={`text-xs font-medium ${vendor.last_run_status === "failed" ? "text-red-600" : "text-gray-500"}`}
            >
              {vendor.last_run_status ? STATUS_LABELS[vendor.last_run_status] : "Aucun run"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>
              <p className="text-gray-400">Dernier run</p>
              <p className="text-gray-700">{formatDate(vendor.last_run_started_at)}</p>
            </div>
            <div>
              <p className="text-gray-400">Produits collectes</p>
              <p className="text-gray-700">{vendor.products_collected ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400">Taux d&apos;echec</p>
              <p className={vendor.failure_rate != null && vendor.failure_rate > 0.5 ? "text-red-600" : "text-gray-700"}>
                {vendor.failure_rate != null ? `${Math.round(vendor.failure_rate * 100)}%` : "—"}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
