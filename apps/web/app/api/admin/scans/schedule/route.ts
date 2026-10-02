// Proxy server-side vers /admin/scans/schedule (protege require_admin cote FastAPI).
import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api-client";

async function forward(response: Response) {
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  return forward(await apiFetch("/admin/scans/schedule"));
}

export async function PUT(request: Request) {
  return forward(
    await apiFetch("/admin/scans/schedule", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: await request.text(),
    }),
  );
}
