"use client";

import { useQuery } from "@tanstack/react-query";

import type { PendingMatchListResponse } from "@/lib/api-types";

async function fetchPendingMatches(): Promise<PendingMatchListResponse> {
  const response = await fetch("/api/admin/matching/pending");
  if (!response.ok) {
    throw new Error("Impossible de charger la file de matching à valider.");
  }
  return response.json();
}

export function usePendingMatches() {
  return useQuery({
    queryKey: ["admin-pending-matches"],
    queryFn: fetchPendingMatches,
  });
}
