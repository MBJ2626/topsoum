import { slugify } from "../../normalize";
import type { MatchStrategy } from "../types";

/**
 * Strategie 1 : matching par reference constructeur / EAN.
 *
 * Realite des donnees : aucun scraper ne capture d'EAN, et offer.reference est
 * le SKU propre au vendeur (different par vendeur pour le meme produit). Cette
 * strategie ne matche donc que lorsque des vendeurs partagent une reference
 * constructeur — rare, mais la correspondance est alors certaine (confiance 1).
 */

/** "LESIA-YOUNG1-BL" -> "lesiayoung1bl" : insensible a la casse, aux accents et a la ponctuation. */
export function normalizeReference(reference: string): string {
  return slugify(reference).replace(/-/g, "");
}

/** Garde anti-collision : une reference trop courte n'identifie rien de fiable. */
const MIN_REFERENCE_LENGTH = 4;

export const eanMatchStrategy: MatchStrategy = {
  name: "ean",
  match(offer, candidates) {
    if (!offer.reference) return null;
    const reference = normalizeReference(offer.reference);
    if (reference.length < MIN_REFERENCE_LENGTH) return null;

    const hits = candidates.filter(
      (candidate) =>
        candidate.category === offer.category &&
        candidate.references.some((known) => normalizeReference(known) === reference),
    );
    // 0 hit = aucun match ; > 1 hit = donnee incoherente (meme reference sur
    // plusieurs produits), on laisse fuzzy/override trancher.
    if (hits.length !== 1) return null;
    return { candidate: hits[0], confidence: 1 };
  },
};
