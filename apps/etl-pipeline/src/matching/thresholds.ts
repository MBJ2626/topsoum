/**
 * Seuils de confiance du matching (bandes de decision) :
 *   >= AUTO_ACCEPT           -> match automatique
 *   [REVIEW, AUTO_ACCEPT)    -> match propose, "a valider manuellement" (dashboard admin)
 *   <  REVIEW                -> aucun match (futur nouveau produit)
 */
export const DEFAULT_AUTO_ACCEPT_THRESHOLD = 0.85;
export const DEFAULT_REVIEW_THRESHOLD = 0.6;
