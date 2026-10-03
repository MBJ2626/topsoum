import { describe, expect, it } from "vitest";

import { fromQuery } from "./async-state";

// Caracterisation (2026-10-03) : le pont React Query -> 3 etats loading/error/success.
describe("fromQuery", () => {
  it("pending -> loading", () => {
    expect(fromQuery({ status: "pending", data: undefined, error: null })).toEqual({ status: "loading" });
  });

  it("pending reste loading meme avec des donnees en cache", () => {
    expect(fromQuery({ status: "pending", data: [1], error: null })).toEqual({ status: "loading" });
  });

  it("error -> message de l'erreur", () => {
    expect(fromQuery({ status: "error", data: undefined, error: new Error("La recherche a échoué.") })).toEqual({
      status: "error",
      message: "La recherche a échoué.",
    });
  });

  it("error sans objet Error -> message de repli (par defaut ou fourni)", () => {
    expect(fromQuery({ status: "error", data: undefined, error: null })).toEqual({
      status: "error",
      message: "Une erreur est survenue.",
    });
    expect(fromQuery({ status: "error", data: undefined, error: null }, undefined, "Connexion perdue")).toEqual({
      status: "error",
      message: "Connexion perdue",
    });
  });

  it("success -> donnees, transformees par map si fourni", () => {
    expect(fromQuery({ status: "success", data: [1, 2], error: null })).toEqual({ status: "success", data: [1, 2] });
    expect(fromQuery({ status: "success", data: [1, 2], error: null }, (d) => d.length)).toEqual({
      status: "success",
      data: 2,
    });
  });

  it("seul status compte : un objet error present avec status success est ignore", () => {
    expect(fromQuery({ status: "success", data: "ok", error: new Error("x") })).toEqual({ status: "success", data: "ok" });
  });
});
