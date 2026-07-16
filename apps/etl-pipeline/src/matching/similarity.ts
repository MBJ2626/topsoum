import { distance } from "fastest-levenshtein";

/** Longueur minimale des deux tokens pour tolerer une typo (Levenshtein <= 1). */
const FUZZY_MIN_TOKEN_LENGTH = 5;

const NUMERIC_RE = /^\d+$/;

/**
 * Egalite de tokens avec tolerance typo : distance de Levenshtein <= 1 si les
 * deux tokens font au moins 5 caracteres. Les tokens purement numeriques
 * exigent l'egalite stricte ("young 1" et "young 6" sont des produits differents).
 */
export function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (NUMERIC_RE.test(a) || NUMERIC_RE.test(b)) return false;
  if (a.length < FUZZY_MIN_TOKEN_LENGTH || b.length < FUZZY_MIN_TOKEN_LENGTH) return false;
  return distance(a, b) <= 1;
}

/**
 * Coefficient de Dice sur deux ensembles de tokens, avec tokensMatch comme
 * egalite : 2 x |appariements| / (|a| + |b|). Chaque token de b ne peut etre
 * apparie qu'une fois.
 */
export function tokenSetSimilarity(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const remaining = [...b];
  let matches = 0;
  for (const token of a) {
    const index = remaining.findIndex((other) => tokensMatch(token, other));
    if (index !== -1) {
      matches++;
      remaining.splice(index, 1);
    }
  }
  return (2 * matches) / (a.length + b.length);
}
