import type { ProductDetailResponse } from "@/lib/api-types";

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
    productName: detail.canonical_name,
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

export function toPriceHistoryPoints(detail: ProductDetailResponse): PricePoint[] {
  return detail.price_history.map((point) => ({
    recordedAt: point.recorded_at,
    price: toNumber(point.price),
  }));
}
