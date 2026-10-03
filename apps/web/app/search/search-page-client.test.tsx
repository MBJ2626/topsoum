// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductSearchResult } from "@/lib/api-types";

// Filtres de la page de recherche : appliques par l'API (marque, RAM, budget),
// options tirees de la recherche sans filtre. Le detail du produit dominant et
// le suivi des clics sont hors sujet ici.
vi.mock("@/features/product-comparison/hooks/useProductDetail", () => ({
  useProductDetail: () => ({ status: "pending", data: undefined, error: null, refetch: vi.fn() }),
}));
vi.mock("@/lib/use-offer-click", () => ({ useOfferClick: () => ({ mutate: vi.fn() }) }));
vi.mock("next/link", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/link")>()),
  useLinkStatus: () => ({ pending: false }),
}));
vi.mock("next/image", () => ({ default: () => null }));

import { SearchPageClient } from "./search-page-client";

function result(id: string, brand: string, ramGb: number | null, price: number): ProductSearchResult {
  return {
    id,
    canonical_name: id,
    brand,
    model: `${brand} ${id}`,
    category: "smartphones",
    image_url: null,
    best_deal: {
      id: `o-${id}`,
      vendor_id: "v",
      vendor_name: "MyTek",
      price,
      currency: "TND",
      stock_status: "in_stock",
      url: "https://www.mytek.tn/x",
      shipping_cost: null,
      scraped_at: "2026-10-04T08:00:00",
    },
    offers_count: 2,
    ram_gb: ramGb,
  };
}

const ALL = [result("x1", "Xiaomi", 8, 700), result("s1", "Samsung", 8, 900), result("a1", "Apple", 6, 3000)];
const fetchMock = vi.fn();

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
  // Recherche sans filtre deja rendue cote serveur (SSR).
  client.setQueryData(["product-search", "phone"], { count: ALL.length, results: ALL });
  render(
    <QueryClientProvider client={client}>
      <SearchPageClient query="phone" isAuthenticated={false} favoritesByProduct={{}} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Filtres/ }));
}

const lastSearchUrl = () => String(fetchMock.mock.calls.at(-1)?.[0]);
const optionLabels = (label: string) =>
  within(screen.getByLabelText(label)).getAllByRole("option").map((option) => option.textContent);

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ count: 0, results: [] }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SearchPageClient — filtres appliques par l'API", () => {
  it("propose toutes les marques et les RAM de la recherche, sans requete supplementaire", () => {
    renderPage();

    expect(optionLabels("Marque")).toEqual(["Toutes les marques", "Xiaomi", "Samsung", "Apple"]);
    expect(optionLabels("RAM")).toEqual(["Toutes", "6 Go", "8 Go"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie la marque choisie a l'API et garde toutes les marques en option", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ count: 1, results: [ALL[2]] }), { status: 200 }));
    renderPage();

    fireEvent.change(screen.getByLabelText("Marque"), { target: { value: "Apple" } });

    await waitFor(() => expect(lastSearchUrl()).toBe("/api/products/search?q=phone&limit=20&brand=Apple"));
    expect(optionLabels("Marque")).toEqual(["Toutes les marques", "Xiaomi", "Samsung", "Apple"]);
  });

  it("envoie la RAM choisie a l'API", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("RAM"), { target: { value: "8" } });

    await waitFor(() => expect(lastSearchUrl()).toBe("/api/products/search?q=phone&limit=20&ram_gb=8"));
  });

  it("n'envoie le budget qu'apres 300 ms sans mouvement du curseur", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Budget max/), { target: { value: "1000" } });
    expect(fetchMock).not.toHaveBeenCalled();

    await waitFor(() => expect(lastSearchUrl()).toBe("/api/products/search?q=phone&limit=20&max_price=1000"));
  });

  it("annonce l'absence de resultat pour ces filtres", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Marque"), { target: { value: "Samsung" } });

    expect(await screen.findByText("Aucun résultat pour ces filtres.")).toBeTruthy();
  });
});
