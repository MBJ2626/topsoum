import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "@/components/ui/Panel";
import { ResultList, type ResultListItem } from "@/features/product-listing/components/ResultList";
import type { ProductSearchResult } from "@/lib/api-types";
import { formatPrice } from "@/lib/format";
import { JsonLd } from "@/lib/json-ld";
import { findLandingPage, type LandingPage } from "@/lib/landing-pages";
import { fetchLandingResults } from "@/lib/landing-results";
import { productDisplayName } from "@/lib/product-name";
import { BASE_OPEN_GRAPH, SITE_URL } from "@/lib/site";

import { LandingBestDeal } from "./landing-best-deal";

interface LandingPageProps {
  params: Promise<{ slug: string }>;
}

// Rendue a la premiere visite puis servie en statique, regeneree au plus
// toutes les heures (ISR) : les prix bougent 2-3 fois par jour. Aucune page
// generee au build : le build ne depend pas de la disponibilite de l'API.
export const revalidate = 3600;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

async function loadLanding(slug: string): Promise<{ page: LandingPage; results: ProductSearchResult[] }> {
  const page = findLandingPage(slug);
  if (!page) notFound();
  return { page, results: await fetchLandingResults(page) };
}

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { page, results } = await loadLanding(slug);
  const url = `/meilleur-prix/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { ...BASE_OPEN_GRAPH, title: page.title, description: page.description, url },
    // Page vide = contenu mince : pas d'indexation tant que le catalogue ne
    // couvre pas la requete (elle est aussi exclue du sitemap).
    robots: results.length === 0 ? { index: false, follow: true } : undefined,
  };
}

function toResultListItem(result: ProductSearchResult): ResultListItem {
  return {
    id: result.id,
    productName: productDisplayName(result),
    imageUrl: result.image_url,
    price: Number(result.best_deal.price),
    currency: result.best_deal.currency,
    vendorName: result.best_deal.vendor_name,
    offersCount: result.offers_count,
  };
}

/** ", de 169 TND à 209 TND", ", tous à 189 TND" ou rien si aucun prix fiable. */
function priceRange(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return prices.length > 1 ? `, tous à ${formatPrice(min)}` : `, à ${formatPrice(min)}`;
  return `, de ${formatPrice(min)} à ${formatPrice(max)}`;
}

export default async function LandingPageRoute({ params }: LandingPageProps) {
  const { slug } = await params;
  const { page, results } = await loadLanding(slug);
  const items = results.map(toResultListItem);
  const prices = items.map((item) => item.price).filter((price) => price > 0);
  const bestResult = results.find((result) => Number(result.best_deal.price) > 0);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4 sm:gap-5">
      <header className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-5 sm:p-8">
        <h1 className="text-balance text-[1.75rem] font-medium leading-tight tracking-display text-gray-900 sm:text-4xl">
          {page.h1}
        </h1>
        <p className="max-w-[60ch] text-base text-gray-600">{page.intro}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-card border border-gray-200 bg-white p-5 text-sm text-gray-500">
          Aucune offre n&apos;est suivie pour le moment.{" "}
          <Link href="/" className="font-medium text-gray-900 underline">
            Lancer une recherche
          </Link>
        </p>
      ) : (
        <>
          {bestResult ? (
            <LandingBestDeal
              data={{
                productName: productDisplayName(bestResult),
                imageUrl: bestResult.image_url,
                vendorName: bestResult.best_deal.vendor_name,
                offerId: bestResult.best_deal.id,
                price: Number(bestResult.best_deal.price),
                currency: bestResult.best_deal.currency,
                averagePrice: null,
                offerUrl: bestResult.best_deal.url,
              }}
            />
          ) : null}

          <Panel title="Tous les produits">
            <p className="tabular mb-3 text-sm text-gray-600">
              {items.length} produit{items.length > 1 ? "s" : ""} comparé{items.length > 1 ? "s" : ""}
              {priceRange(prices)}.
            </p>
            <ResultList state={{ status: "success", data: items }} initialVisibleCount={items.length} />
          </Panel>

          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: page.h1,
              numberOfItems: items.length,
              itemListElement: items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${SITE_URL}/product/${item.id}`,
                name: item.productName,
              })),
            }}
          />
        </>
      )}
    </main>
  );
}
