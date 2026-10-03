// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OfferList, type OfferRow } from "./OfferList";

// Caracterisation (2026-10-03) : les 3 etats d'un composant alimente par l'API.
afterEach(cleanup);

const row = (partial: Partial<OfferRow>): OfferRow => ({
  offerId: "o1",
  vendorName: "Tunisianet",
  price: 169,
  currency: "TND",
  shippingCost: null,
  stockStatus: "in_stock",
  url: "https://www.tunisianet.com.tn/p",
  ...partial,
});

describe("OfferList", () => {
  it("loading : trois lignes squelette, aucune offre ni alerte", () => {
    const { container } = render(<OfferList state={{ status: "loading" }} onRetry={() => {}} />);
    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(screen.queryByTestId("offer-row")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("error : message fixe (pas celui de l'erreur) et bouton Reessayer qui relance", () => {
    const onRetry = vi.fn();
    render(<OfferList state={{ status: "error", message: "détail technique" }} onRetry={onRetry} />);

    expect(screen.getByRole("alert").textContent).toContain("Impossible de charger les autres offres.");
    expect(screen.queryByText("détail technique")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("success vide : message d'absence d'offre", () => {
    render(<OfferList state={{ status: "success", data: [] }} onRetry={() => {}} />);
    expect(screen.getByText("Aucune autre offre disponible pour le moment.")).toBeTruthy();
  });

  it("success : une ligne par offre, dans l'ordre recu", () => {
    render(
      <OfferList
        state={{ status: "success", data: [row({ offerId: "a", vendorName: "MyTek" }), row({ offerId: "b", vendorName: "Spacenet" })] }}
        onRetry={() => {}}
      />,
    );
    const rows = screen.getAllByTestId("offer-row");
    expect(rows.map((r) => r.textContent?.split(/\d/)[0])).toEqual(["MyTek", "Spacenet"]);
  });

  it("success : un prix nul s'affiche 'Prix en cours de mise a jour', jamais 0 TND", () => {
    render(<OfferList state={{ status: "success", data: [row({ price: 0 })] }} onRetry={() => {}} />);
    const text = screen.getByTestId("offer-row").textContent ?? "";
    expect(text).toContain("Prix en cours de mise à jour");
    expect(text).not.toMatch(/0,000/);
  });

  it("success : la rupture masque la ligne de livraison", () => {
    render(
      <OfferList
        state={{ status: "success", data: [row({ stockStatus: "out_of_stock", shippingCost: 7 })] }}
        onRetry={() => {}}
      />,
    );
    const text = screen.getByTestId("offer-row").textContent ?? "";
    expect(text).toContain("Rupture de stock");
    expect(text).not.toContain("livraison");
  });

  it("success : le lien d'offre ouvre un nouvel onglet et notifie le clic", () => {
    const onViewOffer = vi.fn();
    render(<OfferList state={{ status: "success", data: [row({ offerId: "o42" })] }} onRetry={() => {}} onViewOffer={onViewOffer} />);

    const link = screen.getByTestId("offer-row-view-offer");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("href")).toBe("https://www.tunisianet.com.tn/p");
    fireEvent.click(link);
    expect(onViewOffer).toHaveBeenCalledWith("o42");
  });
});
