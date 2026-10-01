import { slugify } from "../../normalize";
import { colorParts, parseSpecs } from "../specsParser";
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
/**
 * RAM contradictoire mais dans un rapport de 1 a 2 (4Go vs 8Go), tout le reste
 * identique : jamais de fusion automatique, mais pas de veto non plus. Un
 * vendeur peut annoncer "8Go" pour 4Go physiques + 4Go virtuels ; un veto
 * creerait un doublon silencieux, invisible dans la file de validation admin.
 * Tout autre ecart (8Go vs 12Go, 4Go vs 6Go) designe une autre version du
 * telephone : veto (cf. isRamVariant).
 */
const CAP_RAM_CONFLICT = 0.65;
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
/** Couleur composee contenant l'autre ("blue+ultramarine" vs "ultramarine"). */
const CAP_PARTIAL_COLOR = 0.8;

/** Une couleur composee en contient strictement une autre. */
function isColorRefinement(a: string, b: string): boolean {
  const partsA = colorParts(a);
  const partsB = colorParts(b);
  const [small, large] = partsA.length < partsB.length ? [partsA, partsB] : [partsB, partsA];
  return small.length < large.length && small.every((part) => large.includes(part));
}

/** Deux candidats trop proches : ambigu, l'admin doit trancher. */
const CAP_AMBIGUOUS = 0.75;
const AMBIGUITY_MARGIN = 0.05;

type ComponentScore = number | "unknown";

interface CandidateScore {
  candidate: MatchCandidate;
  score: number;
  inexactRam: boolean;
  ramConflict: boolean;
  modelSubset: boolean;
  partialColor: boolean;
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

/**
 * Specs du candidat, relues dans son libelle avec l'analyseur ACTUEL : les
 * specs stockees a la creation du produit datent de l'analyseur de l'epoque
 * (ex: "titanium" au lieu de "black-titanium") et feraient rejeter l'offre
 * identique. Champ par champ, repli sur la base : specs stockees, ou parsing
 * du canonicalName seulement si AUCUNE spec n'est stockee.
 */
function resolveCandidateSpecs(candidate: MatchCandidate): ResolvedSpecs {
  const specs: CandidateSpecs = candidate.specs;
  const empty =
    specs.ramGb == null && specs.extendedRamGb == null && specs.storageGb == null && specs.color == null;
  const base: ResolvedSpecs = empty
    ? (({ ramGb, extendedRamGb, storageGb, color }) => ({ ramGb, extendedRamGb, storageGb, color }))(
        parseSpecs(candidate.canonicalName),
      )
    : {
        ramGb: specs.ramGb ?? null,
        extendedRamGb: specs.extendedRamGb ?? null,
        storageGb: specs.storageGb ?? null,
        color: specs.color ?? null,
      };
  const fromModel = parseSpecs(candidate.model);
  const ramFromModel = fromModel.ramGb != null;
  return {
    ramGb: ramFromModel ? fromModel.ramGb : base.ramGb,
    // L'extension suit la RAM de base : jamais deux sources melangees.
    extendedRamGb: ramFromModel ? fromModel.extendedRamGb : base.extendedRamGb,
    storageGb: fromModel.storageGb ?? base.storageGb,
    color: fromModel.color ?? base.color,
  };
}

/**
 * 1 = identiques (base + extension) ; 0.7 = totaux egaux (2+2Go vs 4Go) ;
 * 0.5 = base egale, extension d'un seul cote ; 0 = contradictoires (cf. CAP_RAM_CONFLICT).
 */
function scoreRam(offer: ResolvedSpecs, candidate: ResolvedSpecs): ComponentScore {
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
  return 0;
}

/** RAM physique seule d'un cote, physique + virtuelle (le double) de l'autre. */
function isRamVariant(offer: ResolvedSpecs, candidate: ResolvedSpecs): boolean {
  const offerTotal = (offer.ramGb ?? 0) + (offer.extendedRamGb ?? 0);
  const candidateTotal = (candidate.ramGb ?? 0) + (candidate.extendedRamGb ?? 0);
  return offerTotal === candidateTotal * 2 || candidateTotal === offerTotal * 2;
}

/** Reseau ("4g", "5g") : pas un code modele, un meme telephone l'omet souvent. */
const NETWORK_TOKEN_RE = /^\d+g$/;

/**
 * Codes modele alphanumeriques ("a16", "a5x", "15c", "y05") : comme les
 * nombres purs (cf. numericSetsEqual), un code different designe un autre
 * telephone. "Galaxy A16" et "Galaxy A07" n'ont qu'un token d'ecart, assez
 * pour depasser le seuil de similarite : il faut un veto explicite.
 */
function modelCodesEqual(a: readonly string[], b: readonly string[]): boolean {
  const codes = (tokens: readonly string[]) =>
    [...new Set(tokens.filter((t) => /\d/.test(t) && /[a-z]/.test(t) && !NETWORK_TOKEN_RE.test(t)))].sort().join("|");
  return codes(a) === codes(b);
}

/**
 * Reseau : un vendeur l'omet souvent ("Galaxy A17" vs "Galaxy A17 5G"), ce
 * n'est pas une contradiction. Mais annonce des deux cotes et different
 * ("Redmi Note 15 4G" vs "5G"), ce sont deux telephones.
 */
function networksCompatible(a: readonly string[], b: readonly string[]): boolean {
  const networks = (tokens: readonly string[]) => [...new Set(tokens.filter((t) => NETWORK_TOKEN_RE.test(t)))].sort().join("|");
  const na = networks(a);
  const nb = networks(b);
  return na === "" || nb === "" || na === nb;
}

/** Tokens de `own` sans equivalent dans `other` (hors reseau). */
function unmatchedTokens(own: readonly string[], other: readonly string[]): string[] {
  return extraTokens(other, own).filter((t) => !NETWORK_TOKEN_RE.test(t));
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
      if (!modelCodesEqual(offerModelTokens, candidateModelTokens)) continue;
      if (!networksCompatible(offerModelTokens, candidateModelTokens)) continue;
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
      const ramConflict = ramScore === 0;
      if (ramConflict && !isRamVariant(offerSpecs, candidateSpecs)) continue;
      const inexactRam = typeof ramScore === "number" && ramScore > 0 && ramScore < 1;

      // Couleur : deux couleurs canoniques connues et differentes = veto
      // (Bleu, Bleu Fonce et Bleu Ciel sont des produits distincts).
      let colorScore: ComponentScore;
      let partialColor = false;
      if (offerSpecs.color && candidateSpecs.color) {
        if (offerSpecs.color === candidateSpecs.color) {
          colorScore = 1;
        } else if (isColorRefinement(offerSpecs.color, candidateSpecs.color)) {
          // "Bleu Ultramarine" vs "Ultramarine" : meme couleur, plus ou moins
          // detaillee. Pas de veto, mais jamais de fusion automatique.
          colorScore = 0.5;
          partialColor = true;
        } else {
          continue;
        }
      } else {
        // Couleur reconnue d'un seul cote : si l'autre cote porte a la place un
        // mot sans equivalent ("Starlight", "Plantuim"...), c'est presque
        // toujours une couleur que l'analyseur ne connait pas -> veto.
        if (offerSpecs.color && !candidateSpecs.color) {
          if (unmatchedTokens(candidateModelTokens, offerModelTokens).length > 0) continue;
        } else if (candidateSpecs.color && !offerSpecs.color) {
          if (unmatchedTokens(offerModelTokens, candidateModelTokens).length > 0) continue;
        }
        colorScore = "unknown";
      }

      const score =
        applyWeight(brandScore, WEIGHTS.brand) +
        applyWeight(modelSimilarity, WEIGHTS.model) +
        applyWeight(storageScore, WEIGHTS.storage) +
        applyWeight(ramScore, WEIGHTS.ram) +
        applyWeight(colorScore, WEIGHTS.color);
      scored.push({ candidate, score, inexactRam, ramConflict, modelSubset, partialColor });
    }

    if (scored.length === 0) return null;
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    let confidence = best.score;
    if (best.inexactRam) confidence = Math.min(confidence, CAP_INEXACT_RAM);
    if (best.ramConflict) confidence = Math.min(confidence, CAP_RAM_CONFLICT);
    if (best.modelSubset) confidence = Math.min(confidence, CAP_MODEL_SUBSET);
    if (best.partialColor) confidence = Math.min(confidence, CAP_PARTIAL_COLOR);
    if (scored.length > 1 && scored[1].score >= best.score - AMBIGUITY_MARGIN) {
      confidence = Math.min(confidence, CAP_AMBIGUOUS);
    }

    if (confidence < DEFAULT_REVIEW_THRESHOLD) return null;
    return { candidate: best.candidate, confidence };
  },
};
