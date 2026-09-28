import type { Metadata } from "next";

import { JsonLd, siteJsonLd } from "@/lib/json-ld";
import { BASE_OPEN_GRAPH } from "@/lib/site";

import { HomeSearchClient } from "./home-search-client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

// Philosophie "search-first" : une seule action possible au-dessus du fold.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <JsonLd data={siteJsonLd()} />
      <h1 className="text-2xl font-medium text-gray-900">TopSoum</h1>
      <HomeSearchClient />
    </main>
  );
}
