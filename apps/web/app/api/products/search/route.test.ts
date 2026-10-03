import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Caracterisation (2026-10-03) : la route proxy est le seul chemin client -> API
// pour la recherche, et elle passe par lib/api-client.ts.
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

import { GET } from "./route";

beforeEach(() => {
  apiFetch.mockReset();
});

describe("GET /api/products/search", () => {
  it("relaie la query string telle quelle, sans session", async () => {
    apiFetch.mockResolvedValue(new Response('{"results":[]}', { status: 200 }));

    await GET(new NextRequest("http://localhost/api/products/search?q=iphone%2015&limit=20"));

    expect(apiFetch).toHaveBeenCalledWith("/products/search?q=iphone%2015&limit=20", { auth: false });
  });

  it("renvoie le corps et le statut de l'API, en JSON", async () => {
    apiFetch.mockResolvedValue(new Response('{"detail":"rate limited"}', { status: 429 }));

    const response = await GET(new NextRequest("http://localhost/api/products/search?q=x"));

    expect(response.status).toBe(429);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.text()).toBe('{"detail":"rate limited"}');
  });

  it("laisse remonter une exception de apiFetch (pas de reponse d'erreur construite)", async () => {
    apiFetch.mockRejectedValue(new Error("API_BASE_URL manquant"));
    await expect(GET(new NextRequest("http://localhost/api/products/search?q=x"))).rejects.toThrow("API_BASE_URL manquant");
  });
});
