import { NextRequest, NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await apiFetch(`/favorites/${id}`, { method: "DELETE" });
  return new NextResponse(null, { status: response.status });
}
