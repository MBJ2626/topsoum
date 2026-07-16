import { slugify } from "../../normalize";
import { parseSpecs } from "../specsParser";
import { tokenSetSimilarity, tokensMatch } from "../similarity";
import { DEFAULT_REVIEW_THRESHOLD } from "../thresholds";
import type { CandidateSpecs, MatchCandidate, MatchStrategy } from "../types";

/**
 * Strategie 2 : matching flou par marque + modele + specs (RAM/stockage/couleur).
 *
 * Porte l'essentiel du poids du matching : les vendeurs n'ont pas de reference
 * commune, seuls les libelles se recoupent. Les specs parsees sont traitees en
 * contraintes dures (deux couleurs ou stockages connus et differents eliminent
 * le candidat) ; le flou ne sert qu'a tolerer les typos et variations de forme.
 */

const WEIGHTS = {
  brand: 0.15,
  model: 0.45,
  storage: 0.15,
  ram: 0.125,
  color: 0.125,
} as const;

/** Une spec inconnue d'un cote n'est ni une preuve ni un veto : demi-contribution. */
const UNKNOWN_CONTRIBUTION = 0.5;

/** En dessous, les modeles sont trop eloignes pour etre le meme produit. */
const MODEL_MIN_SIMILARITY = 0.5;

// Plafonds : poussent les cas douteux dans la bande "a valider manuellement".
/** RAM compatible mais non identique (2+2Go vs 4Go) : variante possible. */
const CAP_INEXACT_RAM = 0.8;
/** Tokens modele en inclusion stricte pour un token supplementaire non distinctif. */
const CAP_MODEL_SUBSET = 0.8;

/**
 * Suffixes qui signalent une gamme de produit differente ("iPhone 15" vs
 * "iPhone 15 Pro" : puce, appareil photo et prix differents — ce n'est pas
 * une variation de nommage, ce sont deux produits distincts). Un token
 * supplementaire pris dans cette liste transforme une simple inclusion de
 * tokens en veto, au lieu d'un plafond "a valider manuellement".
 */
const DISTINGUISHING_SUFFIXES = new Set([
  "pro",
  "max",
  "plus",
  "ultra",
  "mini",
  "lite",
  "se",
  "fe",
  "note",
  "edge",
  "air",
  "neo",
]);
/** Deux candidats trop proches : ambigu, l'admin doit trancher. */
const CAP_AMBIGUOUS = 0.75;
const AMBIGUITY_MARGIN = 0.05;

type ComponentScore = number | "unknown";

interface CandidateScore {
  candidate: MatchCandidate;
  score: number;
  inexactRam: boolean;
  modelSubset: boolean;
}

function tokenizeText(value: string): string[] {
  return slugify(value).split("-").filter(Boolean);
}

/** Tous les tokens de a s'apparient dans b (chaque token de b consomme au plus une fois). */
function isTokenSubset(a: readonly string[], b: readonly string[]): boolean {
  const remaining = [...b];
  return a.every((token) => {
    const index = remaining.findIndex((other) => tokensMatch(token, other));
    if (index === -1) return false;
    remaining.splice(index, 1);
    return true;
  });
}

/** Tokens de `larger` non apparies a un token de `smaller` (valide si smaller est inclus dans larger). */
function extraTokens(smaller: readonly string[], larger: readonly string[]): string[] {
  const remaining = [...larger];
  for (const token of smaller) {
    const index = remaining.findIndex((other) => tokensMatch(token, other));
    if (index !== -1) remaining.splice(index, 1);
  }
  return remaining;
}

function hasDistinguishingSuffix(tokens: readonly string[]): boolean {
  return tokens.some((t) => DISTINGUISHING_SUFFIXES.has(t));
}

/** "young 1" vs "young 6" : les tokens numeriques doivent etre identiques des deux cotes. */
function numericSetsEqual(a: readonly string[], b: readonly string[]): boolean {
  const numerics = (tokens: readonly string[]) =>
    [...new Set(tokens.filter((t) => /^\d+$/.test(t)))].sort().join("|");
  return numerics(a) === numerics(b);
}

interface ResolvedSpecs {
  ramGb: number | null;
  extendedRamGb: number | null;
  storageGb: number | null;
  color: string | null;
}

/** Specs du candidat, avec repli sur le parsing de son canonicalName si vides. */
function resolveCandidateSpecs(candidate: MatchCandidate): ResolvedSpecs {
  const specs: CandidateSpecs = candidate.specs;
  const empty =
    specs.ramGb == null && specs.extendedRamGb == null && specs.storageGb == null && specs.color == null;
  if (!empty) {
    return {
      ramGb: specs.ramGb ?? null,
      extendedRamGb: specs.extendedRamGb ?? null,
      storageGb: specs.storageGb ?? null,
      color: specs.color ?? null,
    };
  }
  const parsed = parseSpecs(candidate.canonicalName);
  return {
    ramGb: parsed.ramGb,
    extendedRamGb: parsed.extendedRamGb,
    storageGb: parsed.storageGb,
    color: parsed.color,
  };
}

/**
 * null = incompatibles (veto) ; 1 = identiques (base + extension) ;
 * 0.7 = totaux egaux (2+2Go vs 4Go) ; 0.5 = base egale, extension d'un seul cote.
 */
function scoreRam(offer: ResolvedSpecs, candidate: ResolvedSpecs): ComponentScore | null {
  if (offer.ramGb == null || candidate.ramGb == null) return "unknown";
  const offerTotal = offer.ramGb + (offer.extendedRamGb ?? 0);
  const candidateTotal = candidate.ramGb + (candidate.extendedRamGb ?? 0);
  if (offer.ramGb === candidate.ramGb && (offer.extendedRamGb ?? null) === (candidate.extendedRamGb ?? null)) {
    return 1;
  }
  if (offerTotal === candidateTotal) return 0.7;
  if (offer.ramGb === candidate.ramGb && (offer.extendedRamGb == null) !== (candidate.extendedRamGb == null)) {
    return 0.5;
  }
  return null;
}

function applyWeight(score: ComponentScore, weight: number): number {
  return score === "unknown" ? UNKNOWN_CONTRIBUTION * weight : score * weight;
}

export const fuzzyMatchStrategy: MatchStrategy = {
  name: "fuzzy",
  match(offer, candidates) {
    const parsed = parseSpecs(offer.productName);
    const offerSpecs: ResolvedSpecs = {
      ramGb: parsed.ramGb,
      extendedRamGb: parsed.extendedRamGb,
      storageGb: parsed.storageGb,
      color: parsed.color,
    };
    const offerBrandSlug = offer.brand ? slugify(offer.brand) : null;
    const offerBrandTokens = offer.brand ? tokenizeText(offer.brand) : [];

    const scored: CandidateScore[] = [];
    for (const candidate of candidates) {
      if (candidate.category !== offer.category) continue;

      const candidateBrandTokens = tokenizeText(candidate.brand);

      // Marque : deux marques connues et differentes = veto.
      let brandScore: ComponentScore;
      if (offerBrandSlug) {
        if (offerBrandSlug !== slugify(candidate.brand)) continue;
        brandScore = 1;
      } else {
        brandScore = isTokenSubset(candidateBrandTokens, parsed.modelTokens) ? 1 : "unknown";
      }

      // Modele : tokens de l'offre debarrasses des tokens de marque. Le
      // candidat passe par le meme parseSpecs (pas un tokenizeText brut) :
      // candidate.model peut porter le libelle scrape complet (load.ts cree
      // les nouveaux produits ainsi), donc capacites/couleur/stopwords
      // doivent en etre retires symetriquement, sinon ce bruit dilue
      // artificiellement la similarite face a des offres pourtant identiques.
      const offerModelTokens = parsed.modelTokens.filter(
        (t) => !offerBrandTokens.includes(t) && !candidateBrandTokens.includes(t),
      );
      const candidateModelTokens = parseSpecs(candidate.model).modelTokens.filter(
        (t) => !candidateBrandTokens.includes(t),
      );
      if (!numericSetsEqual(offerModelTokens, candidateModelTokens)) continue;
      const modelSimilarity = tokenSetSimilarity(offerModelTokens, candidateModelTokens);
      if (modelSimilarity < MODEL_MIN_SIMILARITY) continue;

      // Inclusion stricte des tokens modele : un token supplementaire "Pro"/"Max"/...
      // designe une gamme differente (veto) ; un token generique reste un plafond.
      let modelSubset = false;
      if (modelSimilarity < 1) {
        if (isTokenSubset(offerModelTokens, candidateModelTokens)) {
          if (hasDistinguishingSuffix(extraTokens(offerModelTokens, candidateModelTokens))) continue;
          modelSubset = true;
        } else if (isTokenSubset(candidateModelTokens, offerModelTokens)) {
          if (hasDistinguishingSuffix(extraTokens(candidateModelTokens, offerModelTokens))) continue;
          modelSubset = true;
        }
      }

      const candidateSpecs = resolveCandidateSpecs(candidate);

      // Stockage : deux valeurs connues et differentes = veto.
      let storageScore: ComponentScore;
      if (offerSpecs.storageGb != null && candidateSpecs.storageGb != null) {
        if (offerSpecs.storageGb !== candidateSpecs.storageGb) continue;
        storageScore = 1;
      } else {
        storageScore = "unknown";
      }

      const ramScore = scoreRam(offerSpecs, candidateSpecs);
      if (ramScore === null) continue;
      const inexactRam = typeof ramScore === "number" && ramScore < 1;

      // Couleur : deux couleurs canoniques connues et differentes = veto
      // (Bleu, Bleu Fonce et Bleu Ciel sont des produits distincts).
      let colorScore: ComponentScore;
      if (offerSpecs.color && candidateSpecs.color) {
        if (offerSpecs.color !== candidateSpecs.color) continue;
        colorScore = 1;
      } else {
        colorScore = "unknown";
      }

      const score =
        applyWeight(brandScore, WEIGHTS.brand) +
        applyWeight(modelSimilarity, WEIGHTS.model) +
        applyWeight(storageScore, WEIGHTS.storage) +
        applyWeight(ramScore, WEIGHTS.ram) +
        applyWeight(colorScore, WEIGHTS.color);
      scored.push({ candidate, score, inexactRam, modelSubset });
    }

    if (scored.length === 0) return null;
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    let confidence = best.score;
    if (best.inexactRam) confidence = Math.min(confidence, CAP_INEXACT_RAM);
    if (best.modelSubset) confidence = Math.min(confidence, CAP_MODEL_SUBSET);
    if (scored.length > 1 && scored[1].score >= best.score - AMBIGUITY_MARGIN) {
      confidence = Math.min(confidence, CAP_AMBIGUOUS);
    }

    if (confidence < DEFAULT_REVIEW_THRESHOLD) return null;
    return { candidate: best.candidate, confidence };
  },
};
