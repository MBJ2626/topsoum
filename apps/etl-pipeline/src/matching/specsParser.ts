/**
 * Extraction de specs structurees (RAM, stockage, couleur) depuis un nom de
 * produit brut. Les vendeurs n'exposent pas de champs structures : tout est
 * noye dans le libelle ("Smartphone Lesia Young 1 | 2Go / 16Go | Bleu").
 */

export interface ParsedSpecs {
  ramGb: number | null;
  /** RAM etendue : "2+2Go" -> ramGb: 2, extendedRamGb: 2. */
  extendedRamGb: number | null;
  storageGb: number | null;
  /** Couleur canonique ("blue", "dark-blue", ...) ou null si non reconnue. */
  color: string | null;
  /** Tokens residuels apres retrait des capacites, couleur et stopwords (marque incluse). */
  modelTokens: string[];
}

/** Minuscules + suppression des accents (NFD), en conservant les separateurs pour tokeniser. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** "2Go", "128 Go", "2+2Go", "2 + 2Go", "1To" (converti en Go). */
const CAPACITY_RE = /(\d+)\s*(?:\+\s*(\d+))?\s*(go|gb|to|tb)\b/g;

/** Mots generiques sans valeur discriminante ("4g"/"5g" conserves car discriminants). */
const STOPWORDS = new Set(["smartphone", "telephone", "portable", "mobile"]);

/**
 * Sequences couleur FR/EN -> couleur canonique. Le matching teste les
 * sequences les plus longues d'abord ("bleu ciel" doit gagner sur "bleu"),
 * en scannant depuis la fin du nom (les couleurs terminent les libelles).
 */
const COLOR_SEQUENCES: ReadonlyArray<{ tokens: string[]; canonical: string }> = [
  { tokens: ["bleu", "fonce"], canonical: "dark-blue" },
  { tokens: ["dark", "blue"], canonical: "dark-blue" },
  { tokens: ["dark", "bleu"], canonical: "dark-blue" },
  { tokens: ["bleu", "ciel"], canonical: "sky-blue" },
  { tokens: ["sky", "blue"], canonical: "sky-blue" },
  { tokens: ["bleu", "nuit"], canonical: "midnight-blue" },
  { tokens: ["bleu"], canonical: "blue" },
  { tokens: ["blue"], canonical: "blue" },
  { tokens: ["noir"], canonical: "black" },
  { tokens: ["black"], canonical: "black" },
  { tokens: ["blanc"], canonical: "white" },
  { tokens: ["white"], canonical: "white" },
  { tokens: ["vert"], canonical: "green" },
  { tokens: ["green"], canonical: "green" },
  { tokens: ["violet"], canonical: "purple" },
  { tokens: ["purple"], canonical: "purple" },
  { tokens: ["gold"], canonical: "gold" },
  { tokens: ["dore"], canonical: "gold" },
  { tokens: ["silver"], canonical: "silver" },
  { tokens: ["argent"], canonical: "silver" },
  { tokens: ["gris"], canonical: "gray" },
  { tokens: ["grey"], canonical: "gray" },
  { tokens: ["gray"], canonical: "gray" },
  { tokens: ["rouge"], canonical: "red" },
  { tokens: ["red"], canonical: "red" },
  { tokens: ["rose"], canonical: "pink" },
  { tokens: ["pink"], canonical: "pink" },
  { tokens: ["orange"], canonical: "orange" },
  { tokens: ["cyan"], canonical: "cyan" },
  { tokens: ["jaune"], canonical: "yellow" },
  { tokens: ["yellow"], canonical: "yellow" },
  { tokens: ["marron"], canonical: "brown" },
  { tokens: ["brown"], canonical: "brown" },
  { tokens: ["titanium"], canonical: "titanium" },
  { tokens: ["titane"], canonical: "titanium" },
];

const MAX_COLOR_SEQUENCE_LENGTH = Math.max(...COLOR_SEQUENCES.map((c) => c.tokens.length));

/** Normalise une couleur brute isolee ("Bleu Foncé" -> "dark-blue"), null si inconnue. */
export function canonicalizeColor(raw: string): string | null {
  const tokens = tokenize(normalizeText(raw));
  const found = findColor(tokens);
  return found ? found.canonical : null;
}

function tokenize(normalized: string): string[] {
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

interface ColorHit {
  canonical: string;
  start: number;
  length: number;
}

/** Plus longue sequence d'abord ; a longueur egale, l'occurrence la plus proche de la fin gagne. */
function findColor(tokens: string[]): ColorHit | null {
  for (let length = MAX_COLOR_SEQUENCE_LENGTH; length >= 1; length--) {
    let best: ColorHit | null = null;
    for (const entry of COLOR_SEQUENCES) {
      if (entry.tokens.length !== length) continue;
      for (let start = tokens.length - length; start >= 0; start--) {
        if (entry.tokens.every((t, j) => tokens[start + j] === t)) {
          if (!best || start > best.start) {
            best = { canonical: entry.canonical, start, length };
          }
          break;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

interface CapacityMatch {
  baseGb: number;
  extensionGb: number | null;
}

export function parseSpecs(productName: string): ParsedSpecs {
  const normalized = normalizeText(productName);

  // 1. Capacites : extraites dans l'ordre d'apparition puis effacees du texte.
  const capacities: CapacityMatch[] = [];
  const stripped = normalized.replace(CAPACITY_RE, (_match, base: string, ext: string | undefined, unit: string) => {
    const factor = unit === "to" || unit === "tb" ? 1024 : 1;
    capacities.push({
      baseGb: Number(base) * factor,
      extensionGb: ext !== undefined ? Number(ext) * factor : null,
    });
    return " ";
  });

  // 2. Affectation RAM / stockage.
  //    >= 2 occurrences : la 1re est la RAM (base + extension), la 2e le stockage.
  //    1 seule : une extension ("2+2Go") signe une RAM ; sinon >= 32 Go = stockage
  //    ("iPhone 15 128Go"), < 32 Go = RAM.
  let ramGb: number | null = null;
  let extendedRamGb: number | null = null;
  let storageGb: number | null = null;
  const first = capacities[0];
  const second = capacities[1];
  if (capacities.length >= 2) {
    ramGb = first.baseGb;
    extendedRamGb = first.extensionGb;
    storageGb = second.baseGb + (second.extensionGb ?? 0);
  } else if (capacities.length === 1) {
    if (first.extensionGb !== null || first.baseGb < 32) {
      ramGb = first.baseGb;
      extendedRamGb = first.extensionGb;
    } else {
      storageGb = first.baseGb;
    }
  }

  // 3. Couleur puis stopwords sur les tokens residuels.
  let tokens = tokenize(stripped);
  const colorHit = findColor(tokens);
  if (colorHit) {
    tokens = [...tokens.slice(0, colorHit.start), ...tokens.slice(colorHit.start + colorHit.length)];
  }
  const modelTokens = tokens.filter((t) => !STOPWORDS.has(t));

  return {
    ramGb,
    extendedRamGb,
    storageGb,
    color: colorHit ? colorHit.canonical : null,
    modelTokens,
  };
}
