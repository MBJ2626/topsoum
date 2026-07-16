// Proxy server-side vers GET /admin/scrapers/status (protege require_admin
// cote FastAPI). Seul apiFetch (lib/api-client.ts) parle a l'API ; cette
// route est le point d'entree pour features/admin-dashboard.
import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function GET() {
  const response = await apiFetch("/admin/scrapers/status");
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
