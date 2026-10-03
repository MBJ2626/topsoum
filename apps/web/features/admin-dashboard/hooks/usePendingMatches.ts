"use client";

import { useQuery } from "@tanstack/react-query";

import type { PendingMatchListResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchPendingMatches(): Promise<PendingMatchListResponse> {
  const response = await fetch("/api/admin/matching/pending");
  if (!response.ok) {
    throw new HttpError("Impossible de charger la file de matching à valider.", response.status);
  }
  return response.json();
}

export function usePendingMatches() {
  return useQuery({
    queryKey: ["admin-pending-matches"],
    queryFn: fetchPendingMatches,
  });
}
