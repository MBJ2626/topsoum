import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/offers/${id}/click`, { method: "POST", auth: false });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
