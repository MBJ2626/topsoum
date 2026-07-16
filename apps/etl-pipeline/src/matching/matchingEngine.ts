import type { ScrapedOffer } from "@topsoum/shared-types";

import { eanMatchStrategy } from "./strategies/eanMatch";
import { fuzzyMatchStrategy } from "./strategies/fuzzyMatch";
import { createManualOverrideStrategy } from "./strategies/manualOverride";
import { DEFAULT_AUTO_ACCEPT_THRESHOLD, DEFAULT_REVIEW_THRESHOLD } from "./thresholds";
import type {
  ManualOverrideEntry,
  MatchCandidate,
  MatchResult,
  MatchStrategy,
  MatchStrategyName,
  StrategyMatch,
} from "./types";

/**
 * Orchestre les strategies de matching par priorite :
 * eanMatch -> fuzzyMatch -> manualOverride.
 *
 * Consequence de cet ordre (override en dernier, decision validee) : un
 * override ne peut PAS corriger un match automatique deja au-dessus du seuil
 * d'auto-acceptation (l'early-exit se declenche avant lui). Il sert a trancher
 * les cas ambigus (bande "a valider") et les non-matches.
 */

export { DEFAULT_AUTO_ACCEPT_THRESHOLD, DEFAULT_REVIEW_THRESHOLD };

export interface MatchingEngineOptions {
  strategies?: MatchStrategy[];
  /** Au-dessus : match automatique. Defaut 0.85. */
  autoAcceptThreshold?: number;
  /** Au-dessus (et sous autoAccept) : match propose avec needsReview. Defaut 0.6. */
  reviewThreshold?: number;
}

export interface MatchingEngine {
  matchOffer(offer: ScrapedOffer, candidates: readonly MatchCandidate[]): MatchResult;
}

function noMatch(): MatchResult {
  return { candidate: null, confidence: 0, strategy: null, needsReview: false };
}

export function createMatchingEngine(options: MatchingEngineOptions = {}): MatchingEngine {
  const strategies = options.strategies ?? defaultStrategies([]);
  const autoAccept = options.autoAcceptThreshold ?? DEFAULT_AUTO_ACCEPT_THRESHOLD;
  const review = options.reviewThreshold ?? DEFAULT_REVIEW_THRESHOLD;

  return {
    matchOffer(offer, candidates) {
      if (candidates.length === 0) return noMatch();

      let best: { match: StrategyMatch; strategy: MatchStrategyName } | null = null;
      for (const strategy of strategies) {
        const result = strategy.match(offer, candidates);
        if (!result) continue;
        // Early-exit : une strategie suffisamment sure court-circuite les suivantes.
        if (result.confidence >= autoAccept) {
          return {
            candidate: result.candidate,
            confidence: result.confidence,
            strategy: strategy.name,
            needsReview: false,
          };
        }
        if (!best || result.confidence > best.match.confidence) {
          best = { match: result, strategy: strategy.name };
        }
      }

      if (best && best.match.confidence >= review) {
        return {
          candidate: best.match.candidate,
          confidence: best.match.confidence,
          strategy: best.strategy,
          needsReview: true,
        };
      }
      return noMatch();
    },
  };
}

function defaultStrategies(overrides: readonly ManualOverrideEntry[]): MatchStrategy[] {
  return [eanMatchStrategy, fuzzyMatchStrategy, createManualOverrideStrategy(overrides)];
}

/** Moteur avec l'ordre par defaut et une table d'overrides admin optionnelle. */
export function createDefaultMatchingEngine(overrides: readonly ManualOverrideEntry[] = []): MatchingEngine {
  return createMatchingEngine({ strategies: defaultStrategies(overrides) });
}
