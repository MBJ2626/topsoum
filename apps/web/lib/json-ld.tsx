// Donnees structurees schema.org (JSON-LD) : lues par Google pour les
// extraits enrichis (prix, disponibilite) - docs/PROJET.md, prompt 11.
import type { ProductDetailResponse } from "@/lib/api-types";
import { productDisplayName } from "@/lib/product-name";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type JsonLdObject = Record<string, unknown>;

const AVAILABILITY: Record<string, string | undefined> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  // unknown : pas de disponibilite declaree plutot qu'une information fausse.
};

/** Montant schema.org : nombre decimal avec un point, sans devise (ex: "189.9"). */
function schemaPrice(value: number): string {
  return String(Number(value));
}

/**
 * Fiche produit comparee : un Product avec un AggregateOffer (prix mini/maxi,
 * nombre d'offres) et le detail de chaque offre vendeur. Les offres a prix
 * douteux (<= 0) sont exclues : jamais de prix faux dans les resultats Google.
 */
export function productJsonLd(detail: ProductDetailResponse): JsonLdObject | null {
  const offers = detail.offers.filter((offer) => Number(offer.price) > 0);
  if (offers.length === 0) return null;

  const prices = offers.map((offer) => Number(offer.price));
  const currency = offers[0].currency;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productDisplayName(detail),
    ...(detail.image_url ? { image: [detail.image_url] } : {}),
    brand: { "@type": "Brand", name: detail.brand },
    category: detail.category,
    url: `${SITE_URL}/product/${detail.id}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: schemaPrice(Math.min(...prices)),
      highPrice: schemaPrice(Math.max(...prices)),
      offerCount: offers.length,
      offers: offers.map((offer) => ({
        "@type": "Offer",
        price: schemaPrice(offer.price),
        priceCurrency: offer.currency,
        url: offer.url,
        seller: { "@type": "Organization", name: offer.vendor_name },
        ...(AVAILABILITY[offer.stock_status] ? { availability: AVAILABILITY[offer.stock_status] } : {}),
      })),
    },
  };
}

/** Identite de TopSoum (page d'accueil) : Organization + WebSite. */
export function siteJsonLd(): JsonLdObject[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "fr-TN",
    },
  ];
}

/**
 * Balise <script type="application/ld+json">. Les "<" sont echappes : un nom
 * de produit scrape contenant "</script>" ne doit jamais pouvoir fermer la
 * balise et injecter du HTML.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
