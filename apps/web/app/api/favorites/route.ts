// Proxy server-side vers POST /favorites (auth requise, geree par apiFetch
// via la session Next-Auth courante). Seul apiFetch (lib/api-client.ts)
// parle a l'API FastAPI ; cette route est le point d'entree pour
// FavoriteToggle (Client Component).
import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const response = await apiFetch("/favorites", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
