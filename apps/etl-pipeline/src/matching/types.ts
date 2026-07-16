import type { ScrapedOffer } from "@topsoum/shared-types";

/** Nom des strategies de matching, dans l'ordre de priorite d'execution. */
export type MatchStrategyName = "ean" | "fuzzy" | "manual_override";

/** Specs structurees d'un produit candidat (futur mapping depuis Product.specs Json). */
export interface CandidateSpecs {
  ramGb?: number | null;
  /** RAM etendue : "2+2Go" -> ramGb: 2, extendedRamGb: 2. */
  extendedRamGb?: number | null;
  /** Stockage en Go (1 To = 1024 Go). */
  storageGb?: number | null;
  /** Couleur canonique ("blue", "dark-blue", ...), cf. specsParser. */
  color?: string | null;
}

/**
 * Ce que le moteur doit connaitre d'un Product existant pour le matching.
 * Les references constructeur ne sont pas encore persistees en DB (pas de
 * colonne EAN/SKU sur Product) : elles sont portees ici par le candidat.
 */
export interface MatchCandidate {
  id: string;
  brand: string;
  model: string;
  category: string;
  canonicalName: string;
  specs: CandidateSpecs;
  /** References constructeur/vendeur connues pour ce produit. */
  references: string[];
}

/** Resultat brut d'une strategie : un candidat et une confiance dans [0, 1]. */
export interface StrategyMatch {
  candidate: MatchCandidate;
  confidence: number;
}

/** Contrat commun des strategies de matching (pattern Strategy, cf. docs/PROJET.md). */
export interface MatchStrategy {
  readonly name: MatchStrategyName;
  match(offer: ScrapedOffer, candidates: readonly MatchCandidate[]): StrategyMatch | null;
}

/** Decision finale du moteur pour une offre. */
export interface MatchResult {
  candidate: MatchCandidate | null;
  /** 0 si aucun match. */
  confidence: number;
  strategy: MatchStrategyName | null;
  /** true = "a valider manuellement" (file de validation du dashboard admin, Etape 7). */
  needsReview: boolean;
}

/** Correspondance validee manuellement par l'admin (strategie manualOverride). */
export interface ManualOverrideEntry {
  vendor: string;
  /** Cle prioritaire : identifiant de l'offre chez le vendeur. */
  externalId?: string;
  /** Cle secondaire : reference vendeur de l'offre. */
  reference?: string;
  /** MatchCandidate.id du produit cible. */
  productId: string;
}
