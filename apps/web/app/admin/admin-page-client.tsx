"use client";

import { fromQuery } from "@/components/ui/async-state";
import { GlobalStatsBar } from "@/features/admin-dashboard/components/GlobalStatsBar";
import { MatchingQueue } from "@/features/admin-dashboard/components/MatchingQueue";
import { ScanPanel } from "@/features/admin-dashboard/components/ScanPanel";
import { ScanScheduleForm } from "@/features/admin-dashboard/components/ScanScheduleForm";
import { ScraperStatusTable } from "@/features/admin-dashboard/components/ScraperStatusTable";
import { useAdminStats } from "@/features/admin-dashboard/hooks/useAdminStats";
import { usePendingMatches } from "@/features/admin-dashboard/hooks/usePendingMatches";
import { useScans, useScanSchedule } from "@/features/admin-dashboard/hooks/useScans";
import { useScraperStatus } from "@/features/admin-dashboard/hooks/useScraperStatus";

export function AdminPageClient() {
  const statsQuery = useAdminStats();
  const scraperStatusQuery = useScraperStatus();
  const pendingMatchesQuery = usePendingMatches();
  const scansQuery = useScans();
  const scheduleQuery = useScanSchedule();

  const statsState = fromQuery(statsQuery);
  const scraperStatusState = fromQuery(scraperStatusQuery, (data) => data.vendors);
  const pendingMatchesState = fromQuery(pendingMatchesQuery, (data) => data.results);
  const scansState = fromQuery(scansQuery);
  const scheduleState = fromQuery(scheduleQuery);
  const vendorOptions =
    scraperStatusQuery.status === "success"
      ? scraperStatusQuery.data.vendors.map((vendor) => vendor.vendor_name.toLowerCase()).sort()
      : [];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4">
      <h1 className="text-lg font-medium text-gray-900">Dashboard admin</h1>

      {/* Sections courtes d'abord ; la file de matching, sans limite de longueur, en dernier. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-900">Scans</h2>
        <ScanPanel state={scansState} onRetry={() => scansQuery.refetch()} vendorOptions={vendorOptions} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-900">Planification des scans</h2>
        <ScanScheduleForm state={scheduleState} onRetry={() => scheduleQuery.refetch()} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-900">Statut des scrapers</h2>
        <ScraperStatusTable state={scraperStatusState} onRetry={() => scraperStatusQuery.refetch()} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-900">Stats globales</h2>
        <GlobalStatsBar state={statsState} onRetry={() => statsQuery.refetch()} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-900">Matching à valider</h2>
        <MatchingQueue state={pendingMatchesState} onRetry={() => pendingMatchesQuery.refetch()} />
      </section>
    </main>
  );
}
