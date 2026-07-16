import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/admin/matching/${id}/approve`, { method: "POST" });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
