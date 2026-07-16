"use client";

import { useQuery } from "@tanstack/react-query";

import type { ScrapersStatusResponse } from "@/lib/api-types";

async function fetchScraperStatus(): Promise<ScrapersStatusResponse> {
  const response = await fetch("/api/admin/scrapers/status");
  if (!response.ok) {
    throw new Error("Impossible de charger le statut des scrapers.");
  }
  return response.json();
}

export function useScraperStatus() {
  return useQuery({
    queryKey: ["admin-scrapers-status"],
    queryFn: fetchScraperStatus,
  });
}
