import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Caracterisation de apiFetch (comportement observe le 2026-10-03). Session,
// token et IP sont des dependances serveur : remplacees ici, fetch est espionne.
const deps = vi.hoisted(() => ({
  auth: vi.fn(),
  mintBackendToken: vi.fn(),
  currentClientIp: vi.fn(),
  signClientIp: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: deps.auth }));
vi.mock("@/lib/auth-token", () => ({ mintBackendToken: deps.mintBackendToken }));
vi.mock("@/lib/client-ip", () => ({
  CLIENT_IP_HEADER: "x-topsoum-client-ip",
  CLIENT_IP_SIGNATURE_HEADER: "x-topsoum-client-ip-signature",
  currentClientIp: deps.currentClientIp,
  signClientIp: deps.signClientIp,
}));

import { apiFetch } from "./api-client";

const fetchMock = vi.fn();

function lastCall(): { url: string; init: RequestInit; headers: Headers } {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: init.headers as Headers };
}

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://api.test");
  vi.stubEnv("API_AUTH_SECRET", "secret");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  deps.auth.mockReset().mockResolvedValue(null);
  deps.mintBackendToken.mockReset().mockResolvedValue("jwt-token");
  deps.currentClientIp.mockReset().mockResolvedValue("41.226.1.2");
  deps.signClientIp.mockReset().mockReturnValue("signature");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("concatene API_BASE_URL et le chemin, et renvoie la Response telle quelle", async () => {
    const upstream = new Response("boom", { status: 503 });
    fetchMock.mockResolvedValue(upstream);

    const response = await apiFetch("/products/search?q=iphone");

    expect(lastCall().url).toBe("http://api.test/products/search?q=iphone");
    expect(response).toBe(upstream);
  });

  it("ne leve pas sur un statut HTTP d'erreur : c'est a l'appelant de tester response.ok", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    await expect(apiFetch("/x")).resolves.toHaveProperty("status", 500);
  });

  it("transmet methode, corps et en-tetes de l'appelant", async () => {
    await apiFetch("/favorites", { method: "POST", body: '{"product_id":"p1"}', headers: { "content-type": "application/json" } });

    const { init, headers } = lastCall();
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"product_id":"p1"}');
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("n'expose pas ses options propres (auth, forwardClientIp) a fetch", async () => {
    await apiFetch("/x", { auth: false, forwardClientIp: false });
    expect(lastCall().init).not.toHaveProperty("auth");
    expect(lastCall().init).not.toHaveProperty("forwardClientIp");
  });

  it("ajoute un Bearer token quand une session existe", async () => {
    const session = { user: { id: "u1" } };
    deps.auth.mockResolvedValue(session);

    await apiFetch("/favorites");

    expect(deps.mintBackendToken).toHaveBeenCalledWith(session);
    expect(lastCall().headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("n'ajoute aucun Authorization sans session", async () => {
    await apiFetch("/favorites");
    expect(lastCall().headers.has("Authorization")).toBe(false);
  });

  it("auth: false ne consulte meme pas la session", async () => {
    await apiFetch("/products/search", { auth: false });
    expect(deps.auth).not.toHaveBeenCalled();
    expect(lastCall().headers.has("Authorization")).toBe(false);
  });

  it("transmet l'IP du visiteur signee avec API_AUTH_SECRET", async () => {
    await apiFetch("/x");

    expect(deps.signClientIp).toHaveBeenCalledWith("41.226.1.2", "secret");
    expect(lastCall().headers.get("x-topsoum-client-ip")).toBe("41.226.1.2");
    expect(lastCall().headers.get("x-topsoum-client-ip-signature")).toBe("signature");
  });

  it("ne transmet pas d'IP avec forwardClientIp: false (pages ISR)", async () => {
    await apiFetch("/x", { forwardClientIp: false });
    expect(deps.currentClientIp).not.toHaveBeenCalled();
    expect(lastCall().headers.has("x-topsoum-client-ip")).toBe(false);
  });

  it("ne transmet pas d'IP sans API_AUTH_SECRET, ni quand l'IP est inconnue", async () => {
    vi.stubEnv("API_AUTH_SECRET", "");
    await apiFetch("/x");
    expect(lastCall().headers.has("x-topsoum-client-ip")).toBe(false);

    vi.stubEnv("API_AUTH_SECRET", "secret");
    deps.currentClientIp.mockResolvedValue(null);
    await apiFetch("/x");
    expect(lastCall().headers.has("x-topsoum-client-ip")).toBe(false);
  });

  it("leve 'API_BASE_URL manquant' sans URL d'API, apres avoir consulte la session", async () => {
    vi.stubEnv("API_BASE_URL", "");

    await expect(apiFetch("/x")).rejects.toThrow("API_BASE_URL manquant");
    expect(deps.auth).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
