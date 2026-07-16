// Point d'entree unique du Product Matching Engine (Etape 4) pour le
// futur cablage dans le pipeline (load.ts, Etape 5).
export type {
  CandidateSpecs,
  ManualOverrideEntry,
  MatchCandidate,
  MatchResult,
  MatchStrategy,
  MatchStrategyName,
  StrategyMatch,
} from "./types";
export { parseSpecs, canonicalizeColor, normalizeText } from "./specsParser";
export type { ParsedSpecs } from "./specsParser";
export { tokensMatch, tokenSetSimilarity } from "./similarity";
export { eanMatchStrategy, normalizeReference } from "./strategies/eanMatch";
export { fuzzyMatchStrategy } from "./strategies/fuzzyMatch";
export { createManualOverrideStrategy } from "./strategies/manualOverride";
export {
  createMatchingEngine,
  createDefaultMatchingEngine,
  DEFAULT_AUTO_ACCEPT_THRESHOLD,
  DEFAULT_REVIEW_THRESHOLD,
} from "./matchingEngine";
export type { MatchingEngine, MatchingEngineOptions } from "./matchingEngine";
