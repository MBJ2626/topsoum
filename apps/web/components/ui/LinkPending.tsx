"use client";

import { useLinkStatus } from "next/link";

/**
 * Retour au tap sur un lien vers une page rendue cote serveur : a placer DANS
 * le <Link>, qui recoit LINK_PENDING_CLASS. Pendant la navigation, le lien
 * s'estompe (apres 100 ms : une navigation rapide ne clignote pas). Pas de
 * loading.tsx sur ces routes : le streaming ferait repondre 200 au lieu de
 * 404 (fiche introuvable) ou de 307 (favoris sans session).
 */
// Transition et delai seulement pendant l'attente : sinon ils ecraseraient le
// transition-colors (survol) que portent deja les liens.
export const LINK_PENDING_CLASS =
  "has-[[data-pending]]:opacity-60 has-[[data-pending]]:transition-opacity has-[[data-pending]]:delay-100";

export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <span data-pending="" aria-hidden="true" /> : null;
}
