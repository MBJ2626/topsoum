import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { apiFetch } from "@/lib/api-client";
import { getQueryClient } from "@/lib/get-query-client";

import { AdminPageClient } from "./admin-page-client";

export const metadata: Metadata = { title: "Dashboard admin — TopSoum" };

// Protection deja geree par middleware.ts (matcher "/admin/:path*",
// isAdmin !== true -> redirect "/") : pas de check supplementaire ici.
export default async function AdminPage() {
  const queryClient = getQueryClient();

  const [scrapersResponse, pendingMatchesResponse, statsResponse] = await Promise.all([
    apiFetch("/admin/scrapers/status"),
    apiFetch("/admin/matching/pending"),
    apiFetch("/admin/stats"),
  ]);

  if (scrapersResponse.ok) {
    queryClient.setQueryData(["admin-scrapers-status"], await scrapersResponse.json());
  }
  if (pendingMatchesResponse.ok) {
    queryClient.setQueryData(["admin-pending-matches"], await pendingMatchesResponse.json());
  }
  if (statsResponse.ok) {
    queryClient.setQueryData(["admin-stats"], await statsResponse.json());
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminPageClient />
    </HydrationBoundary>
  );
}
