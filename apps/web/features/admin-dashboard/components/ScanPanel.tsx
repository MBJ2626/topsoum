"use client";

import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { hasActiveScan, useStartScan } from "@/features/admin-dashboard/hooks/useScans";
import type { ScanJobOut, ScanJobStatus, ScanListResponse, VendorScanResult } from "@/lib/api-types";

interface ScanPanelProps {
  state: AsyncState<ScanListResponse>;
  onRetry: () => void;
  /** Slugs proposes dans le selecteur (vendeurs deja connus du statut des scrapers). */
  vendorOptions: string[];
}

const STATUS_LABELS: Record<ScanJobStatus, string> = {
  queued: "En file",
  running: "En cours",
  success: "Terminé",
  partial: "Partiel",
  failed: "Échec",
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Tunis",
});

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

function describeResult(result: VendorScanResult): string {
  if (result.error) return result.error;
  const parts = [plural(result.offers_collected ?? 0, "offre")];
  if (result.offers_loaded != null) parts.push(`${result.offers_loaded} chargée${result.offers_loaded > 1 ? "s" : ""}`);
  parts.push(result.scan_failures > 0 ? `${plural(result.scan_failures, "page")} en échec` : "aucune page en échec");
  return parts.join(", ");
}

function ScanJobRow({ job }: { job: ScanJobOut }) {
  const target = job.vendors.length > 0 ? job.vendors.join(", ") : "tous les revendeurs";
  return (
    <li className="flex flex-col gap-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-gray-900">
          {DATE_FORMAT.format(new Date(job.requested_at))}
          <span className="font-normal text-gray-500"> · {job.trigger === "manual" ? "manuel" : "planifié"}</span>
        </p>
        <span
          className={`flex-none text-xs font-medium ${job.status === "failed" ? "text-red-600" : "text-gray-500"}`}
        >
          {STATUS_LABELS[job.status]}
        </span>
      </div>
      <p className="text-xs text-gray-500">{target}</p>
      {job.results.length > 0 ? (
        <ul className="flex flex-col gap-1 text-xs">
          {job.results.map((result) => (
            <li key={result.vendor} className={`tabular ${result.error ? "text-red-600" : "text-gray-700"}`}>
              <span className="font-medium">{result.vendor}</span> : {describeResult(result)}
            </li>
          ))}
        </ul>
      ) : null}
      {job.error ? <p className="text-xs text-red-600">{job.error}</p> : null}
    </li>
  );
}

export function ScanPanel({ state, onRetry, vendorOptions }: ScanPanelProps) {
  const [vendor, setVendor] = useState("");
  const startScan = useStartScan();

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4">
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-1/3" />
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger les scans." onRetry={onRetry} />;
  }

  const { data } = state;
  const active = hasActiveScan(data);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">
          {data.worker_online
            ? "Worker actif : les scans demandés partent dans les 15 secondes."
            : "Worker arrêté : les scans restent en file jusqu'à son démarrage (pnpm dev, ou le service worker en production)."}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm text-gray-700">
            Revendeurs
            <select
              value={vendor}
              onChange={(event) => setVendor(event.target.value)}
              className="min-h-[44px] rounded-key border border-field bg-white px-3 text-gray-900"
            >
              <option value="">Tous les revendeurs</option>
              {vendorOptions.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={active || startScan.isPending}
            onClick={() => startScan.mutate(vendor ? [vendor] : [])}
          >
            {active ? "Scan en cours…" : "Lancer un scan"}
          </Button>
        </div>
        {startScan.isError ? (
          <p role="alert" className="text-xs text-red-600">
            {startScan.error.message}
          </p>
        ) : null}
      </div>

      {data.jobs.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun scan lancé depuis le dashboard pour le moment.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-card border border-gray-200 bg-white">
          {data.jobs.map((job) => (
            <ScanJobRow key={job.id} job={job} />
          ))}
        </ul>
      )}
    </div>
  );
}
