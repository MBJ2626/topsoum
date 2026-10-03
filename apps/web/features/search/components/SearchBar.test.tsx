// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Suggestions hors sujet ici : aucune requete.
vi.mock("../hooks/useSearchSuggestions", () => ({
  useSearchSuggestions: () => ({ status: "pending", data: undefined, refetch: vi.fn() }),
}));

import { SearchBar } from "./SearchBar";

afterEach(cleanup);

// docs/PROJET.md 5.4/5.5 : retour immediat au tap et anti double-clic pendant la navigation.
describe("SearchBar — recherche en cours", () => {
  it("au repos : la touche Chercher est active et soumet la requete", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);
    const key = screen.getByRole("button", { name: "Chercher" });

    expect(key.hasAttribute("disabled")).toBe(false);
    expect(key.getAttribute("aria-busy")).toBeNull();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "iphone 15" } });
    fireEvent.click(key);
    expect(onSubmit).toHaveBeenCalledWith("iphone 15");
  });

  it("pendant la navigation : la touche est occupee et desactivee", () => {
    render(<SearchBar onSubmit={vi.fn()} pending />);
    const key = screen.getByRole("button", { name: "Chercher" });

    expect(key.hasAttribute("disabled")).toBe(true);
    expect(key.getAttribute("aria-busy")).toBe("true");
  });

  it("pendant la navigation : une seconde soumission est ignoree", () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} pending initialValue="iphone 15" />);

    fireEvent.submit(screen.getByRole("combobox").closest("form") as HTMLFormElement);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
