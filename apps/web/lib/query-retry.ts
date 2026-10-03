import { HttpError } from "@/lib/http-error";

// Reseau mobile tunisien instable : 2 relances silencieuses avec backoff
// (docs/PROJET.md 5.4) avant d'afficher l'etat d'erreur et son bouton
// Reessayer. Une erreur definitive (404, 401...) s'affiche tout de suite.
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 4000;

/** Statuts HTTP qui peuvent reussir a la tentative suivante. */
function isTransient(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof HttpError) return isTransient(error.status);
  // Coupure reseau (TypeError de fetch) ou cause inconnue : peut-etre passagere.
  return true;
}

/** 1 s, 2 s, puis plafond de 4 s. */
export function retryDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
}

/** Options par defaut partagees par le QueryClient navigateur et serveur. */
export const QUERY_DEFAULTS = {
  queries: {
    retry: shouldRetry,
    retryDelay,
    staleTime: 30_000,
  },
};
