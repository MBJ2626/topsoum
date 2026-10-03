// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Retour immediat au tap sur un lien vers une fiche (docs/PROJET.md 5.4) :
// pendant la navigation, le marqueur porte data-pending et le lien s'estompe.
const linkStatus = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/link")>()),
  useLinkStatus: () => linkStatus,
}));
vi.mock("next/image", () => ({ default: () => null }));

import { ResultList } from "@/features/product-listing/components/ResultList";
import { SimilarProducts } from "@/features/product-listing/components/SimilarProducts";

import { LINK_PENDING_CLASS, LinkPending } from "./LinkPending";

afterEach(cleanup);
beforeEach(() => {
  linkStatus.pending = false;
});

const item = { id: "p1", productName: "iPhone 15", imageUrl: null, price: 1599, currency: "TND", vendorName: "MyTek", offersCount: 2 };

describe("LinkPending", () => {
  it("ne marque rien tant que la navigation n'a pas commence", () => {
    const { container } = render(<LinkPending />);
    expect(container.querySelector("[data-pending]")).toBeNull();
  });

  it("marque la navigation en cours", () => {
    linkStatus.pending = true;
    const { container } = render(<LinkPending />);
    expect(container.querySelector("[data-pending]")).not.toBeNull();
  });

  it("le lien s'estompe apres 100 ms quand il contient le marqueur actif", () => {
    // Transition et delai seulement pendant l'attente : le lien garde son transition-colors de survol.
    expect(LINK_PENDING_CLASS).toBe(
      "has-[[data-pending]]:opacity-60 has-[[data-pending]]:transition-opacity has-[[data-pending]]:delay-100",
    );
  });
});

describe("liens vers une fiche produit", () => {
  it.each([
    ["ResultList", () => <ResultList state={{ status: "success", data: [item] }} />],
    ["SimilarProducts", () => <SimilarProducts state={{ status: "success", data: [item] }} onRetry={() => {}} />],
  ])("%s : chaque lien porte le marqueur et la classe d'attente", (_, renderList) => {
    linkStatus.pending = true;
    render(renderList());

    const link = screen.getByRole("link", { name: /iPhone 15/ });
    expect(link.querySelector("[data-pending]")).not.toBeNull();
    expect(link.className).toContain(LINK_PENDING_CLASS);
  });
});
