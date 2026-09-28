import type { Metadata } from "next";

import Link from "next/link";

import { JsonLd, siteJsonLd } from "@/lib/json-ld";
import { LANDING_PAGES, type LandingPage } from "@/lib/landing-pages";
import { fetchLandingResults } from "@/lib/landing-results";
import { BASE_OPEN_GRAPH } from "@/lib/site";

import { HomeSearchClient } from "./home-search-client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

// Liens "Recherches populaires" rafraichis au plus toutes les heures (ISR).
export const revalidate = 3600;

/** Landing pages ayant des produits ; aucune si l'API est indisponible (l'accueil ne doit jamais tomber). */
async function popularLandings(): Promise<LandingPage[]> {
  try {
    const results = await Promise.all(LANDING_PAGES.map((page) => fetchLandingResults(page)));
    return LANDING_PAGES.filter((_, index) => results[index].length > 0);
  } catch {
    return [];
  }
}

// Philosophie "search-first" : une seule action possible au-dessus du fold.
// Les liens vers les landing pages (maillage interne SEO) sont SOUS le fold :
// <main> occupe tout l'ecran, la liste n'apparait qu'en faisant defiler.
export default async function HomePage() {
  const landings = await popularLandings();

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <JsonLd data={siteJsonLd()} />
        <h1 className="text-2xl font-medium text-gray-900">TopSoum</h1>
        <HomeSearchClient />
      </main>

      {landings.length > 0 ? (
        <nav aria-labelledby="popular-searches" className="mx-auto max-w-xl px-6 pb-10">
          <h2 id="popular-searches" className="mb-2 text-sm font-medium text-gray-500">
            Recherches populaires
          </h2>
          <ul className="flex flex-wrap gap-x-4">
            {landings.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/meilleur-prix/${page.slug}`}
                  className="inline-flex min-h-[44px] items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
