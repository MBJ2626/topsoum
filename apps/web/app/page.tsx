import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";

import { JsonLd, siteJsonLd } from "@/lib/json-ld";
import { LANDING_PAGES, type LandingPage } from "@/lib/landing-pages";
import { fetchLandingResults } from "@/lib/landing-results";
import { Wordmark } from "@/components/ui/Wordmark";
import { BASE_OPEN_GRAPH, COMPARED_VENDORS } from "@/lib/site";

import { HomeSearchClient } from "./home-search-client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

// Liens "Comparatifs" rafraichis au plus toutes les heures (ISR).
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

/**
 * Appareils poses sur la face de boite : rendus officiels (fond transparent,
 * 1000 px a l'origine) heberges dans public/showcase, donc toujours nets et
 * jamais casses par une URL revendeur qui disparait. Image d'ambiance : ni
 * lien ni texte alternatif (jamais une seconde action sur l'accueil).
 */
const SHOWCASE = [
  { src: "/showcase/iphone-17-pro-max-orange.webp", box: "start-0 z-0 h-[86%] w-[60%]" },
  { src: "/showcase/galaxy-s26-ultra.webp", box: "end-0 z-10 h-full w-[66%]" },
] as const;

// Philosophie "search-first" : une seule action possible au-dessus du fold.
// La face de boite occupe l'ecran ; les liens vers les landing pages (maillage
// interne SEO) sont SOUS le fold et n'apparaissent qu'en faisant defiler.
export default async function HomePage() {
  const landings = await popularLandings();

  return (
    <>
      <main className="flex min-h-[100svh] flex-col p-3 sm:p-6">
        <JsonLd data={siteJsonLd()} />
        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col rounded-card border border-gray-200 bg-white px-5 pb-5 pt-3 sm:px-12 sm:pb-10 sm:pt-6">
          <Wordmark />

          <div className="grid flex-1 items-center gap-6 py-8 sm:py-10 md:grid-cols-[1fr_minmax(0,20rem)] md:gap-10">
          <div className="flex flex-col gap-5 sm:gap-7">
            <h1 className="max-w-[18ch] text-balance text-[2.125rem] font-medium leading-[1.08] tracking-display text-gray-900 sm:text-6xl sm:leading-[1.04] md:text-[3.25rem]">
              Le meilleur prix, sans faire le tour des boutiques.
            </h1>
            <p className="max-w-[46ch] text-base text-gray-500 sm:text-lg">
              Tapez un modèle : on compare {COMPARED_VENDORS.join(", ").replace(/, ([^,]*)$/, " et $1")} et on vous
              montre la meilleure offre.
            </p>
            <div className="max-w-2xl">
              <HomeSearchClient />
            </div>
          </div>

          {/* Deux appareils cote a cote, poses sur la meme ligne de base. */}
          <div aria-hidden="true" className="relative mx-auto h-56 w-full max-w-[20rem] sm:h-72 md:h-[24rem] md:max-w-none">
            {SHOWCASE.map((device) => (
              <div key={device.src} className={`absolute bottom-0 ${device.box}`}>
                <Image
                  src={device.src}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 224px, 200px"
                  className="object-contain object-bottom"
                />
              </div>
            ))}
          </div>
          </div>

          {/* Etiquette laterale de la boite : qui est compare. */}
          <div className="flex items-baseline justify-between gap-6 border-t-2 border-gray-900 pt-3 text-sm">
            <dl className="flex items-baseline gap-x-6">
              <dt className="flex-none text-gray-500">Comparé chez</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1 font-medium text-gray-900">
                {COMPARED_VENDORS.map((vendor) => (
                  <span key={vendor}>{vendor}</span>
                ))}
              </dd>
            </dl>
            <p className="hidden flex-none text-gray-500 sm:block">Prix en dinars (TND)</p>
          </div>
        </section>
      </main>

      {landings.length > 0 ? (
        <nav aria-labelledby="popular-searches" className="mx-auto w-full max-w-4xl px-3 pb-12 pt-4 sm:px-6">
          <h2 id="popular-searches" className="mb-3 px-2 text-sm font-medium text-gray-500">
            Comparatifs
          </h2>
          <ul className="flex flex-wrap gap-2">
            {landings.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/meilleur-prix/${page.slug}`}
                  className="inline-flex min-h-[44px] items-center rounded-key border border-gray-200 bg-white px-4 text-sm text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
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
