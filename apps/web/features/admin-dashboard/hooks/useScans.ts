"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ScanJobOut, ScanListResponse, ScanScheduleOut } from "@/lib/api-types";

/** Message de l'API ("detail") si present, sinon le message par defaut. */
async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

export const SCANS_QUERY_KEY = ["admin-scans"] as const;
export const SCAN_SCHEDULE_QUERY_KEY = ["admin-scan-schedule"] as const;

export function hasActiveScan(data: ScanListResponse | undefined): boolean {
  return data?.jobs.some((job) => job.status === "queued" || job.status === "running") ?? false;
}

export function useScans() {
  return useQuery({
    queryKey: SCANS_QUERY_KEY,
    queryFn: async (): Promise<ScanListResponse> => {
      const response = await fetch("/api/admin/scans");
      if (!response.ok) throw new Error("Impossible de charger les scans.");
      return response.json();
    },
    // Suivi en direct pendant un scan, rafraichissement lent sinon.
    refetchInterval: (query) => (hasActiveScan(query.state.data) ? 5_000 : 30_000),
  });
}

export function useStartScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendors: string[]): Promise<ScanJobOut> => {
      const response = await fetch("/api/admin/scans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vendors }),
      });
      if (response.status === 409) throw new Error("Un scan est déjà en file ou en cours.");
      if (!response.ok) throw new Error(await errorMessage(response, "Impossible de lancer le scan."));
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCANS_QUERY_KEY }),
  });
}

export function useScanSchedule() {
  return useQuery({
    queryKey: SCAN_SCHEDULE_QUERY_KEY,
    queryFn: async (): Promise<ScanScheduleOut> => {
      const response = await fetch("/api/admin/scans/schedule");
      if (!response.ok) throw new Error("Impossible de charger la planification.");
      return response.json();
    },
  });
}

export function useSaveScanSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { enabled: boolean; times: string[] }): Promise<ScanScheduleOut> => {
      const response = await fetch("/api/admin/scans/schedule", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (!response.ok) throw new Error(await errorMessage(response, "Impossible d'enregistrer la planification."));
      return response.json();
    },
    onSuccess: (saved) => queryClient.setQueryData(SCAN_SCHEDULE_QUERY_KEY, saved),
  });
}
