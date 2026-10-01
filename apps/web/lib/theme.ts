// Un seul accent dans tout le produit (bouton principal, onglet "Meilleur prix",
// focus), voir DESIGN.md. Source unique partagee entre tailwind.config.ts et les
// composants qui ont besoin de la valeur hex brute (ex: Recharts, manifest).
export const ACCENT_COLOR = "#3a5bff";

// Encre et filets du graphique d'historique (Recharts ne lit pas Tailwind).
// Courbe d'historique a l'encre : l'accent reste reserve a l'action.
export const CHART_LINE_COLOR = "#15171c";
export const CHART_AXIS_COLOR = "#9aa0a9";
export const CHART_GRID_COLOR = "#e2e5e9";
