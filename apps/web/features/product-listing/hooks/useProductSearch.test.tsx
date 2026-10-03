// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_DEFAULTS } from "@/lib/query-retry";

import { useProductSearch } from "./useProductSearch";

// Caracterisation (2026-10-03) : un hook client passe par la route Next
// /api/products/search (proxy vers lib/api-client.ts) et expose 3 etats.
const fetchMock = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useProductSearch", () => {
  it("loading puis success avec la reponse JSON", async () => {
    const body = { results: [{ id: "p1" }], limit: 20, offset: 0 };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

    const { result } = renderHook(() => useProductSearch("iphone 15"), { wrapper });

    expect(result.current.status).toBe("pending");
    expect(result.current.fetchStatus).toBe("fetching");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith("/api/products/search?q=iphone%2015&limit=20");
  });

  it("error avec un message utilisateur fixe sur reponse HTTP non ok", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));

    const { result } = renderHook(() => useProductSearch("iphone"), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("La recherche a échoué.");
  });

  it("error avec le message brut du navigateur quand le reseau tombe", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useProductSearch("iphone"), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("Failed to fetch");
  });

  it("requete vide ou blanche : aucun appel, reste pending sans chargement", () => {
    const { result } = renderHook(() => useProductSearch("   "), { wrapper });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("pending");
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useProductSearch — relances silencieuses (politique de l'application)", () => {
  function appWrapper({ children }: { children: ReactNode }) {
    // Meme politique que app/providers.tsx, backoff ramene a 0 pour le test.
    const client = new QueryClient({ defaultOptions: { queries: { ...QUERY_DEFAULTS.queries, retryDelay: 0 } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it("un 503 passager est relance sans jamais montrer d'erreur", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));

    const { result } = renderHook(() => useProductSearch("iphone"), { wrapper: appWrapper });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("une coupure persistante finit en erreur apres 3 tentatives", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useProductSearch("iphone"), { wrapper: appWrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("une erreur definitive (400) n'est pas relancee et garde le message utilisateur", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 400 }));

    const { result } = renderHook(() => useProductSearch("iphone"), { wrapper: appWrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.error?.message).toBe("La recherche a échoué.");
  });
});
