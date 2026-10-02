import { describe, expect, it } from "vitest";

import { aggregateStatus, dueSlots, isValidTime, slotInstant, type VendorScanResult } from "./schedule";

// Tunis = UTC+1 toute l'annee (pas d'heure d'ete).
const EPOCH = new Date("2026-01-01T00:00:00Z");

describe("slotInstant", () => {
  it("convertit une heure de Tunis en UTC", () => {
    expect(slotInstant({ year: 2026, month: 10, day: 2 }, "08:00").toISOString()).toBe("2026-10-02T07:00:00.000Z");
    expect(slotInstant({ year: 2026, month: 10, day: 2 }, "00:30").toISOString()).toBe("2026-10-01T23:30:00.000Z");
  });
});

describe("dueSlots", () => {
  it("declenche un creneau passe depuis moins de 30 min", () => {
    const now = new Date("2026-10-02T07:10:00Z"); // 08:10 a Tunis
    expect(dueSlots({ times: ["08:00", "13:00"], configuredAt: EPOCH, now }).map((d) => d.toISOString())).toEqual([
      "2026-10-02T07:00:00.000Z",
    ]);
  });

  it("abandonne un creneau rate depuis plus de 30 min", () => {
    const now = new Date("2026-10-02T07:45:00Z");
    expect(dueSlots({ times: ["08:00"], configuredAt: EPOCH, now })).toEqual([]);
  });

  it("ignore un creneau anterieur a la derniere modification", () => {
    const now = new Date("2026-10-02T07:10:00Z");
    const configuredAt = new Date("2026-10-02T07:05:00Z");
    expect(dueSlots({ times: ["08:00"], configuredAt, now })).toEqual([]);
  });

  it("gere un creneau de 23:50 vu apres minuit", () => {
    const now = new Date("2026-10-02T23:05:00Z"); // 00:05 le 3 a Tunis
    expect(dueSlots({ times: ["23:50"], configuredAt: EPOCH, now }).map((d) => d.toISOString())).toEqual([
      "2026-10-02T22:50:00.000Z",
    ]);
  });

  it("ignore les heures invalides", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("8:00")).toBe(false);
    expect(isValidTime("19:30")).toBe(true);
    expect(dueSlots({ times: ["99:99"], configuredAt: EPOCH, now: new Date() })).toEqual([]);
  });
});

describe("aggregateStatus", () => {
  const ok: VendorScanResult = { vendor: "a", offersCollected: 10, scanFailures: 0, offersLoaded: 10, error: null };

  it("success si tout est propre", () => {
    expect(aggregateStatus([ok, { ...ok, vendor: "b" }])).toBe("success");
  });

  it("partial si une page a echoue ou un vendeur a plante", () => {
    expect(aggregateStatus([ok, { ...ok, scanFailures: 2 }])).toBe("partial");
    expect(aggregateStatus([ok, { ...ok, error: "boom" }])).toBe("partial");
  });

  it("failed si tous les vendeurs ont echoue ou aucun", () => {
    expect(aggregateStatus([{ ...ok, error: "x" }])).toBe("failed");
    expect(aggregateStatus([])).toBe("failed");
  });
});
