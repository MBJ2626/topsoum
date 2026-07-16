export function formatPrice(amount: number, currency = "TND"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/** Retourne le pourcentage sous la moyenne (arrondi), ou null si non pertinent. */
export function computeDiscountPercent(price: number, averagePrice: number | null | undefined): number | null {
  if (averagePrice == null || averagePrice <= 0 || price >= averagePrice) {
    return null;
  }
  return Math.round(((averagePrice - price) / averagePrice) * 100);
}
