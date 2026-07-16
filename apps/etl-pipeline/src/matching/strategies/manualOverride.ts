import type { ManualOverrideEntry, MatchStrategy } from "../types";
import { normalizeReference } from "./eanMatch";

/**
 * Strategie 3 : correspondances validees manuellement par l'admin.
 *
 * La table est injectee (module pur, pas de chargement DB) ; la persistance et
 * l'edition arrivent avec le dashboard admin (Etape 7). Un hit vaut confiance 1.
 * Pas de garde categorie : la decision de l'admin fait foi.
 */
export function createManualOverrideStrategy(table: readonly ManualOverrideEntry[]): MatchStrategy {
  const byExternalId = new Map<string, string>();
  const byReference = new Map<string, string>();
  for (const entry of table) {
    if (entry.externalId) byExternalId.set(`${entry.vendor}:${entry.externalId}`, entry.productId);
    if (entry.reference) byReference.set(`${entry.vendor}:${normalizeReference(entry.reference)}`, entry.productId);
  }

  return {
    name: "manual_override",
    match(offer, candidates) {
      const productId =
        byExternalId.get(`${offer.vendor}:${offer.externalId}`) ??
        (offer.reference ? byReference.get(`${offer.vendor}:${normalizeReference(offer.reference)}`) : undefined);
      if (!productId) return null;
      // Resolution dans la liste injectee uniquement : si le produit cible
      // n'y figure pas, l'override est inapplicable ici.
      const candidate = candidates.find((c) => c.id === productId);
      return candidate ? { candidate, confidence: 1 } : null;
    },
  };
}
