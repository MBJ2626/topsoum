export function formatPrice(amount: number, currency = "TND"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export const PRICE_PENDING_LABEL = "Prix en cours de mise à jour";

/** Prix formate, ou le libelle d'attente : jamais "0,000 TND" a l'ecran. */
export function displayPrice(amount: number, currency = "TND"): string {
  return Number(amount) > 0 ? formatPrice(amount, currency) : PRICE_PENDING_LABEL;
}

/** Retourne le pourcentage sous la moyenne (arrondi), ou null si non pertinent. */
export function computeDiscountPercent(price: number, averagePrice: number | null | undefined): number | null {
  if (averagePrice == null || averagePrice <= 0 || price >= averagePrice) {
    return null;
  }
  const percent = Math.round(((averagePrice - price) / averagePrice) * 100);
  // Un "-0%" n'apprend rien a l'utilisateur : pas d'indicateur sous 1 %.
  return percent >= 1 ? percent : null;
}
