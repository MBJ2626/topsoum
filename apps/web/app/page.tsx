import { HomeSearchClient } from "./home-search-client";

// Philosophie "search-first" : une seule action possible au-dessus du fold.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-medium text-gray-900">TopSoum</h1>
      <HomeSearchClient />
    </main>
  );
}
