"use client";

import { useMutation } from "@tanstack/react-query";

async function recordOfferClick(offerId: string): Promise<void> {
  const response = await fetch(`/api/offers/${offerId}/click`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Le suivi du clic a echoue");
  }
}

/**
 * Tracking d'affiliation best-effort : ne doit jamais bloquer la navigation
 * vers le vendeur si l'appel echoue, d'ou l'absence de gestion d'etat UI ici.
 */
export function useOfferClick() {
  return useMutation({ mutationFn: recordOfferClick });
}
