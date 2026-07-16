// Proxy server-side vers GET /admin/stats (protege require_admin cote FastAPI).
import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function GET() {
  const response = await apiFetch("/admin/stats");
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
