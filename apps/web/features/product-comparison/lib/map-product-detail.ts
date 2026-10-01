import type { ProductDetailResponse } from "@/lib/api-types";
import { productDisplayName } from "@/lib/product-name";

import type { OfferRow } from "../components/OfferList";
import type { PricePoint } from "../components/PriceHistoryChart";

// Le backend serialise les champs Decimal (price, shipping_cost) en chaines
// JSON (ex: "169.000"), malgre le type `number` declare dans api-types.ts.
// La plupart des operateurs JS coercent silencieusement (>, -, /, Math.max),
// mais pas Array.reduce((a,b)=>a+b) (concatenation de chaines) ni les valeurs
// passees a Recharts : on normalise donc explicitement en Number() ici, a la
// frontiere entre l'API et les composants (qui, eux, attendent de vrais number).
function toNumber(value: number): number {
  return Number(value);
}

// Pas d'import du type BestDealCardData (feature product-listing) : le typage
// structurel de TypeScript suffit a valider la compatibilite au point d'appel,
// evitant un couplage direct entre les deux features (cf. favoriteSlot).
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
