// Calcul des creneaux planifies (heures de Tunis) et du statut d'un scan.
// Pur, sans DB : teste dans schedule.test.ts.

export const SCAN_TIMEZONE = "Africa/Tunis";
/** Un creneau rate de plus de 30 min (worker arrete) est abandonne, pas rattrape. */
export const SLOT_GRACE_MS = 30 * 60 * 1000;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** Date calendaire (annee, mois 1-12, jour) de `instant` dans le fuseau `timeZone`. */
function calendarDate(instant: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/** Decalage (ms) du fuseau par rapport a UTC a l'instant donne. */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, number>>((acc, part) => ({ ...acc, [part.type]: Number(part.value) }), {});
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Instant UTC du creneau "HH:MM" au jour calendaire `day` du fuseau. */
export function slotInstant(
  day: { year: number; month: number; day: number },
  time: string,
  timeZone = SCAN_TIMEZONE,
): Date {
  const [hour, minute] = time.split(":").map(Number);
  const naive = Date.UTC(day.year, day.month - 1, day.day, hour, minute);
  return new Date(naive - offsetMs(new Date(naive), timeZone));
}

/**
 * Creneaux a declencher maintenant : passes depuis moins de SLOT_GRACE_MS et
 * posterieurs a la derniere modification de la planification (aujourd'hui et
 * hier, pour un creneau juste avant minuit).
 */
export function dueSlots(options: {
  times: string[];
  configuredAt: Date;
  now: Date;
  timeZone?: string;
}): Date[] {
  const { times, configuredAt, now, timeZone = SCAN_TIMEZONE } = options;
  const today = calendarDate(now, timeZone);
  const yesterday = calendarDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), timeZone);

  return [yesterday, today]
    .flatMap((day) => times.filter(isValidTime).map((time) => slotInstant(day, time, timeZone)))
    .filter(
      (slot) =>
        slot.getTime() <= now.getTime() &&
        now.getTime() - slot.getTime() < SLOT_GRACE_MS &&
        slot.getTime() >= configuredAt.getTime(),
    );
}

export interface VendorScanResult {
  vendor: string;
  /** Offres ecrites par le scraper (null si le scraper a echoue). */
  offersCollected: number | null;
  /** Pages que le scraper n'a pas pu lire (robots.txt, timeout...). */
  scanFailures: number;
  /** Offres chargees en DB par l'ETL (null si non charge). */
  offersLoaded: number | null;
  error: string | null;
}

export type ScanJobStatus = "queued" | "running" | "success" | "partial" | "failed";

export function aggregateStatus(results: VendorScanResult[]): ScanJobStatus {
  if (results.length === 0 || results.every((result) => result.error !== null)) return "failed";
  const clean = results.every((result) => result.error === null && result.scanFailures === 0);
  return clean ? "success" : "partial";
}
