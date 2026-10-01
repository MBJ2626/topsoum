import type { Metadata } from "next";

// Identite du site pour le SEO (metadataBase, URLs canoniques, Open Graph,
// JSON-LD, sitemap). NEXT_PUBLIC_SITE_URL permet de pointer une preprod ;
// par defaut, le domaine de production.
export const SITE_NAME = "TopSoum";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://topsoum.com").replace(/\/+$/, "");

/**
 * Champs Open Graph communs. Next.js ne fusionne pas `openGraph` entre layout
 * et page : un openGraph declare par une page remplace entierement celui du
 * layout. Chaque page qui en declare un part donc de cette base.
 */
export const BASE_OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  locale: "fr_TN",
} satisfies NonNullable<Metadata["openGraph"]>;

/** Revendeurs actuellement compares (MVP), affiches sur l'accueil. */
export const COMPARED_VENDORS = ["Tunisianet", "MyTek", "Spacenet"] as const;
