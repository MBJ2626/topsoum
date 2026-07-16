// Proxy server-side vers GET /products/{id} (endpoint public). Les Client
// Components ne peuvent pas utiliser lib/api-client.ts (server-only) : ils
// passent par cette route Next.js pour la page /product/[id].
import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/products/${id}`, { auth: false });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
