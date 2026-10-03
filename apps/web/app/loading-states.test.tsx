// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SearchLoading from "./search/loading";

// docs/PROJET.md 5.4 : pendant le rendu serveur des resultats de recherche, un
// skeleton de la meme forme s'affiche des la recherche lancee. Les fiches et
// les favoris n'ont pas de loading.tsx (statuts 404/307 preserves) : voir
// components/ui/LinkPending.tsx.
afterEach(cleanup);

function expectBusyPage() {
  const main = screen.getByRole("main");
  expect(main.getAttribute("aria-busy")).toBe("true");
  expect(within(main).getByRole("status").textContent).toBe("Chargement…");
  // Squelette inerte : aucune action, aucune alerte d'erreur.
  expect(within(main).queryByRole("button")).toBeNull();
  expect(within(main).queryByRole("link")).toBeNull();
  expect(within(main).queryByRole("alert")).toBeNull();
  expect(main.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  return main;
}

describe("loading.tsx des pages rendues cote serveur", () => {
  it("recherche : meilleur deal puis autres vendeurs", () => {
    render(<SearchLoading />);
    const main = expectBusyPage();
    expect(within(main).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Autres vendeurs"]);
  });
});
