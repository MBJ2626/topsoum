"use client";

import { useQuery } from "@tanstack/react-query";

import type { ScrapersStatusResponse } from "@/lib/api-types";
import { HttpError } from "@/lib/http-error";

async function fetchScraperStatus(): Promise<ScrapersStatusResponse> {
  const response = await fetch("/api/admin/scrapers/status");
  if (!response.ok) {
    throw new HttpError("Impossible de charger le statut des scrapers.", response.status);
  }
  return response.json();
}

export function useScraperStatus() {
  return useQuery({
    queryKey: ["admin-scrapers-status"],
    queryFn: fetchScraperStatus,
  });
}
