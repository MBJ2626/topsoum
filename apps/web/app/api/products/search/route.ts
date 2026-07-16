// Proxy server-side vers GET /products/search (endpoint public). Les
// Client Components ne peuvent pas utiliser lib/api-client.ts (server-only) :
// ils passent par cette route Next.js, qui reste le seul appelant reel de
// l'API FastAPI pour cette recherche.
import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  const response = await apiFetch(`/products/search${request.nextUrl.search}`, { auth: false });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
