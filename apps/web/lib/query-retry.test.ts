import { describe, expect, it } from "vitest";

import { HttpError } from "./http-error";
import { QUERY_DEFAULTS, retryDelay, shouldRetry } from "./query-retry";

// docs/PROJET.md 5.4 : "Retry automatique avec backoff (2-3 tentatives silencieuses)".
describe("shouldRetry", () => {
  it("relance deux fois une coupure reseau, pas trois", () => {
    const offline = new TypeError("Failed to fetch");
    expect([0, 1, 2].map((failureCount) => shouldRetry(failureCount, offline))).toEqual([true, true, false]);
  });

  it.each([500, 502, 503, 504, 408, 429])("relance une erreur HTTP transitoire (%i)", (status) => {
    expect(shouldRetry(0, new HttpError("x", status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])("ne relance jamais une erreur HTTP definitive (%i)", (status) => {
    expect(shouldRetry(0, new HttpError("x", status))).toBe(false);
  });

  it("relance une erreur sans statut (cause inconnue, peut-etre transitoire)", () => {
    expect(shouldRetry(0, new Error("x"))).toBe(true);
  });
});

describe("retryDelay", () => {
  it("attend 1 s puis 2 s (backoff exponentiel), plafonne a 4 s", () => {
    expect([0, 1, 2, 5].map((attempt) => retryDelay(attempt))).toEqual([1000, 2000, 4000, 4000]);
  });
});

describe("QUERY_DEFAULTS", () => {
  it("branche la regle de relance et le backoff sur les requetes", () => {
    expect(QUERY_DEFAULTS.queries).toMatchObject({ retry: shouldRetry, retryDelay, staleTime: 30_000 });
  });
});

describe("HttpError", () => {
  it("garde le message affiche a l'utilisateur et porte le statut", () => {
    const error = new HttpError("Impossible de charger le produit.", 503);
    expect(error).toBeInstanceOf(Error);
    expect([error.message, error.status, error.name]).toEqual(["Impossible de charger le produit.", 503, "HttpError"]);
  });
});
