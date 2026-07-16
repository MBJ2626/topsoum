// Proxy server-side vers GET/POST /favorites (auth requise, geree par apiFetch
// via la session Next-Auth courante). Seul apiFetch (lib/api-client.ts)
// parle a l'API FastAPI ; cette route est le point d'entree pour
// FavoriteToggle et la page /favorites (Client Components).
import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function GET() {
  const response = await apiFetch("/favorites");
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}

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
