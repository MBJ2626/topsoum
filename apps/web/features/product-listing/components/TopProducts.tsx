import Link from "next/link";

import { ProductImage } from "@/components/ui/ProductImage";
import type { TopProduct, TopProductsResponse } from "@/lib/api-types";
import { displayPrice, formatPrice } from "@/lib/format";
import { productDisplayName } from "@/lib/product-name";

// Le titre dit d'ou vient le classement : jamais "populaire" sans mesure reelle.
const COPY: Record<TopProductsResponse["mode"], { title: string; intro: (days: number | null) => string }> = {
  most_compared: {
    title: "Les plus comparés",
    intro: () => "Les téléphones vendus chez le plus de revendeurs suivis, au meilleur prix trouvé.",
  },
  most_viewed: {
    title: "Les plus consultés",
    intro: (days) => `Les fiches les plus ouvertes sur TopSoum ces ${days ?? 7} derniers jours.`,
  },
};

function caption(item: TopProduct, mode: TopProductsResponse["mode"]): string {
  const vendors = `${item.offers_count} revendeur${item.offers_count > 1 ? "s" : ""}`;
  // Ecart sous 1 TND : pas un argument, on ne l'affiche pas.
  const spread = item.price_spread != null && Number(item.price_spread) >= 1;
  if (mode === "most_compared" && spread) {
    return `${vendors}, jusqu'à ${formatPrice(Number(item.price_spread), item.best_deal.currency)} d'écart`;
  }
  return item.offers_count > 1 ? vendors : `chez ${item.best_deal.vendor_name}`;
}

// Etiquette laterale de l'accueil, sous le fold : filet d'encre, rangs et
// prix tabulaires, aucun accent (l'accent reste a "Chercher").
export function TopProducts({ data }: { data: TopProductsResponse }) {
  if (data.results.length === 0) return null;
  const copy = COPY[data.mode];

  return (
    <section aria-labelledby="top-products" className="rounded-card border border-gray-200 bg-white p-4 sm:p-6">
      <h2 id="top-products" className="text-base font-medium text-gray-900">
        {copy.title}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{copy.intro(data.period_days)}</p>

      <div className="mt-3 border-t-2 border-gray-900">
        <div className="flex justify-between py-2 text-xs text-gray-500">
          <span>Téléphone</span>
          <span className="hidden sm:inline">Meilleur prix</span>
        </div>
        <ol className="divide-y divide-gray-200 border-t border-gray-200">
          {data.results.map((item, index) => {
            const name = productDisplayName(item);
            const price = Number(item.best_deal.price);
            const priceTone = price > 0 ? "font-medium text-gray-900" : "text-gray-500";
            return (
              <li key={item.id}>
                <Link
                  href={`/product/${item.id}`}
                  className="-mx-2 flex min-h-[44px] items-center gap-3 rounded-key px-2 py-3 transition-colors hover:bg-gray-50"
                >
                  <span className="tabular w-4 flex-none text-sm text-gray-500" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="relative h-14 w-14 flex-none overflow-hidden rounded-key">
                    {item.image_url ? <ProductImage src={item.image_url} alt={name} sizes="56px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-gray-900">
                      <span className="sr-only">{index + 1}. </span>
                      {name}
                    </p>
                    {/* Sous 640 px, le prix passe sous le nom : la colonne de droite ecrasait les noms. */}
                    <p className={`tabular mt-0.5 text-sm sm:hidden ${priceTone}`}>
                      {displayPrice(price, item.best_deal.currency)}
                    </p>
                    <p className="tabular text-xs text-gray-500">{caption(item, data.mode)}</p>
                  </div>
                  <span className={`tabular hidden flex-none text-end text-sm sm:block ${priceTone}`}>
                    {displayPrice(price, item.best_deal.currency)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
