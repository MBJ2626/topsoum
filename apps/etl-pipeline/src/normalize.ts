import { CATEGORIES, VENDORS } from "@topsoum/config";
import type { ScrapedOffer } from "@topsoum/shared-types";

import type { RawScrapedOffer } from "./types";

export const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  tunisianet: "Tunisianet",
  mytek: "MyTek",
  spacenet: "Spacenet",
};

/**
 * Graphies officielles des marques qui ne suivent pas la regle par defaut
 * (premiere lettre de chaque mot en majuscule). Cle = marque en minuscules.
 */
const BRAND_SPELLINGS: Record<string, string> = {
  hp: "HP",
  lg: "LG",
  tcl: "TCL",
  zte: "ZTE",
  msi: "MSI",
  oneplus: "OnePlus",
  itel: "itel",
  realme: "realme",
};

/**
 * Une marque = une seule graphie, quel que soit le vendeur ("LESIA" chez MyTek,
 * "Lesia" ailleurs) : sinon le filtre Marque du frontend la propose en double.
 * Ne depend que de la marque en minuscules, jamais de la graphie du vendeur.
 */
export function normalizeBrand(brand: string | null | undefined): string | null {
  const key = brand?.trim().replace(/\s+/g, " ").toLowerCase();
  if (!key) return null;
  return (
    BRAND_SPELLINGS[key] ??
    key.replace(/(^|[\s-])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toUpperCase())
  );
}

/** Nettoyage basique : espaces, casse. Le matching cross-vendeur est fait par matching/matchingEngine.ts, cable dans load.ts. */
export function normalizeOffer(raw: RawScrapedOffer): ScrapedOffer {
  const vendor = raw.vendor.trim().toLowerCase();
  if (!VENDORS.includes(vendor as (typeof VENDORS)[number])) {
    throw new Error(`Vendeur inconnu: ${raw.vendor}`);
  }

  const category = raw.category.trim().toLowerCase();
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error(`Categorie inconnue: ${raw.category}`);
  }

  if (!raw.external_id || !raw.url) {
    throw new Error("external_id et url sont requis");
  }

  if (!Number.isFinite(raw.price) || raw.price <= 0) {
    throw new Error(`Prix invalide: ${raw.price}`);
  }

  return {
    vendor,
    externalId: String(raw.external_id).trim(),
    productName: raw.product_name.trim().replace(/\s+/g, " "),
    brand: normalizeBrand(raw.brand),
    category,
    reference: raw.reference?.trim() || null,
    price: Math.round(raw.price * 1000) / 1000,
    currency: raw.currency.trim().toUpperCase(),
    stockStatus: raw.stock_status,
    url: raw.url.trim(),
    imageUrl: raw.image_url?.trim() || null,
    shippingCost: raw.shipping_cost,
    scrapedAt: raw.scraped_at,
  };
}

/** "iPhone 15 128Go Noir" -> "iphone-15-128go-noir", utilise pour Product.canonicalName. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cle de creation d'un nouveau Product (branche "aucun match" du matching
 * engine, cf. matching/matchingEngine.ts). Agnostique du vendeur : le
 * regroupement cross-vendeur passe desormais par le matching engine, pas
 * par l'egalite de ce nom.
 */
export function canonicalNameFor(offer: ScrapedOffer): string {
  const brandPart = offer.brand ?? "generic";
  const identityPart = offer.reference ?? offer.productName;
  return slugify(`${brandPart}-${identityPart}`);
}
