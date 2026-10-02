import type { OfferSummary, ProductDetailResponse } from "@/lib/api-types";
import { productDisplayName } from "@/lib/product-name";

import type { OfferRow } from "../components/OfferList";
import type { PricePoint } from "../components/PriceHistoryChart";

// Les Decimal arrivent en chaines JSON ("169.000") malgre le type `number` :
// normalises ici, sinon reduce((a, b) => a + b) concatene.
function toNumber(value: number): number {
  return Number(value);
}

// Pas d'import du type BestDealCardData (feature product-listing) : le typage
// structurel de TypeScript suffit a valider la compatibilite au point d'appel,
// evitant un couplage direct entre les deux features (cf. favoriteSlot).
const STOCK_REASONS: Record<OfferSummary["stock_status"], string> = {
  out_of_stock: "rupture de stock",
  unknown: "stock non confirmé",
  in_stock: "revendeur moins bien noté",
};

/** Offre la moins chere quand le score en a retenu une autre (cf. apps/api services/scoring.py). */
function findCheaperOffer(detail: ProductDetailResponse) {
  const bestPrice = toNumber(detail.best_deal.price);
  const bestLanded = bestPrice + toNumber(detail.best_deal.shipping_cost ?? 0);
  const cheaper = detail.offers
    .filter((offer) => offer.id !== detail.best_deal.id && toNumber(offer.price) > 0 && toNumber(offer.price) < bestPrice)
    .sort((a, b) => toNumber(a.price) - toNumber(b.price))[0];
  if (!cheaper || bestPrice <= 0) return null;

  const landed = toNumber(cheaper.price) + toNumber(cheaper.shipping_cost ?? 0);
  const reason =
    cheaper.stock_status === "in_stock" && landed >= bestLanded ? "hors frais de livraison" : STOCK_REASONS[cheaper.stock_status];
  return { vendorName: cheaper.vendor_name, price: toNumber(cheaper.price), currency: cheaper.currency, reason };
}

export function toBestDealCardData(detail: ProductDetailResponse) {
  const prices = detail.offers.map((offer) => toNumber(offer.price)).filter((price) => price > 0);
  const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;

  return {
    productName: productDisplayName(detail),
    imageUrl: detail.image_url,
    vendorName: detail.best_deal.vendor_name,
    offerId: detail.best_deal.id,
    price: toNumber(detail.best_deal.price),
    currency: detail.best_deal.currency,
    averagePrice,
    offerUrl: detail.best_deal.url,
    cheaperOffer: findCheaperOffer(detail),
  };
}

export function toOfferRows(detail: ProductDetailResponse): OfferRow[] {
  return detail.offers
    .filter((offer) => offer.id !== detail.best_deal.id)
    .map((offer) => ({
      offerId: offer.id,
      vendorName: offer.vendor_name,
      price: toNumber(offer.price),
      currency: offer.currency,
      shippingCost: offer.shipping_cost != null ? toNumber(offer.shipping_cost) : null,
      stockStatus: offer.stock_status,
      url: offer.url,
    }));
}

/**
 * Historique du MEILLEUR prix disponible, tous revendeurs confondus.
 *
 * price_history melange les releves de chaque offre (un par revendeur) : les
 * relier tels quels ferait zigzaguer la courbe d'un revendeur a l'autre. On
 * rejoue donc les releves dans l'ordre chronologique en gardant le dernier prix
 * connu de chaque offre, et on retient a chaque instant le plus bas. Un point
 * n'est emis que si ce meilleur prix change (les releves en double, ou ceux
 * d'un revendeur plus cher, n'ajoutent rien), plus un point final a la date du
 * dernier releve pour que la courbe aille jusqu'a aujourd'hui.
 */
export function toPriceHistoryPoints(detail: ProductDetailResponse): PricePoint[] {
  const readings = detail.price_history
    .map((point) => ({ offerId: point.offer_id, recordedAt: point.recorded_at, price: toNumber(point.price) }))
    // Un prix <= 0 est un prix douteux : jamais trace (cf. PRODUCT.md).
    .filter((reading) => reading.price > 0)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const latestByOffer = new Map<string, number>();
  const series: PricePoint[] = [];

  for (const reading of readings) {
    latestByOffer.set(reading.offerId, reading.price);
    const best = Math.min(...latestByOffer.values());
    if (series.length === 0 || series[series.length - 1].price !== best) {
      series.push({ recordedAt: reading.recordedAt, price: best });
    }
  }

  const lastReading = readings[readings.length - 1];
  const lastPoint = series[series.length - 1];
  if (lastReading && lastPoint && lastPoint.recordedAt !== lastReading.recordedAt) {
    series.push({ recordedAt: lastReading.recordedAt, price: lastPoint.price });
  }

  return series;
}
