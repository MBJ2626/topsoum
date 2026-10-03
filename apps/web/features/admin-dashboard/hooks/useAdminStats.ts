"use client";

import { useQuery } from "@tanstack/react-query";

import type { AdminStatsResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const response = await fetch("/api/admin/stats");
  if (!response.ok) {
    throw new HttpError("Impossible de charger les statistiques globales.", response.status);
  }
  return response.json();
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });
}
