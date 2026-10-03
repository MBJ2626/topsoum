import Link from "next/link";

import { LINK_PENDING_CLASS, LinkPending } from "@/components/ui/LinkPending";
import type { TopProduct, TopProductsResponse } from "@/lib/api-types";
import { displayPrice } from "@/lib/format";
import { productDisplayName } from "@/lib/product-name";

// Le titre dit d'ou vient le classement : jamais "populaire" sans mesure reelle.
const TITLES: Record<TopProductsResponse["mode"], (days: number | null) => string> = {
  most_compared: () => "Les plus comparés",
  most_viewed: (days) => `Les plus consultés (${days ?? 7} j)`,
};

function vendorsLabel(item: TopProduct): string {
  return `${item.offers_count} revendeur${item.offers_count > 1 ? "s" : ""}`;
}

/**
 * Etiquette laterale compacte sous la recherche de l'accueil : meme langage
 * que la bande "Compare chez" (filet d'encre, en-tetes muets, lignes fines),
 * sans vignette ni accent, pour que la recherche reste la seule action forte.
 */
export function TopProducts({ data }: { data: TopProductsResponse }) {
  if (data.results.length === 0) return null;

  return (
    <section aria-labelledby="top-products" className="border-t-2 border-gray-900 text-sm">
      <div className="flex items-baseline justify-between gap-3 py-2 text-xs text-gray-500">
        <h2 id="top-products" className="font-normal">
          {TITLES[data.mode](data.period_days)}
        </h2>
        <span aria-hidden="true">Meilleur prix</span>
      </div>
      <ol className="divide-y divide-gray-200 border-t border-gray-200">
        {data.results.map((item, index) => {
          const price = Number(item.best_deal.price);
          return (
            <li key={item.id}>
              <Link
                href={`/product/${item.id}`}
                className={`-mx-2 flex min-h-[44px] items-center gap-3 rounded-key px-2 py-2 transition-colors hover:bg-gray-50 ${LINK_PENDING_CLASS}`}
              >
                <LinkPending />
                <span className="tabular w-3 flex-none text-gray-500" aria-hidden="true">
                  {index + 1}
                </span>
                {/* Deux lignes : tronque a une seule, "iPhone 17 256 Go / Noir" et "/ Blanc" se confondaient. */}
                <span className="line-clamp-2 min-w-0 flex-1 text-gray-900">{productDisplayName(item)}</span>
                {data.mode === "most_compared" ? (
                  <span className="hidden flex-none text-xs text-gray-500 lg:inline">{vendorsLabel(item)}</span>
                ) : null}
                <span
                  className={`tabular flex-none text-end lg:w-28 ${price > 0 ? "font-medium text-gray-900" : "text-gray-500"}`}
                >
                  {displayPrice(price, item.best_deal.currency)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
