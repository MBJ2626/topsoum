// Proxy server-side vers POST /products/{id}/view (audience anonyme).
import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

// Les robots d'indexation executent le JavaScript : sans ce filtre, Googlebot
// gonflerait "Les plus consultes".
const CRAWLER_PATTERN = /bot|crawler|spider|slurp|preview|lighthouse|headless/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (CRAWLER_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 });
  }
  const { id } = await params;
  const response = await apiFetch(`/products/${encodeURIComponent(id)}/view`, { method: "POST", auth: false });
  return new NextResponse(null, { status: response.status });
}
