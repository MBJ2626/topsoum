"use client";

import { useEffect } from "react";

/**
 * Compte une consultation de fiche produit pour "Les plus consultes" : une
 * par produit et par onglet (sessionStorage), jamais pour un navigateur
 * automatise (navigator.webdriver : tests, robots).
 */
export function useRecordProductView(productId: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || navigator.webdriver) return;
    const key = `topsoum:viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Stockage indisponible (navigation privee stricte) : on compte quand meme.
    }
    void fetch(`/api/products/${encodeURIComponent(productId)}/view`, { method: "POST", keepalive: true }).catch(() => {
      // Mesure d'audience : un echec ne doit jamais gener la fiche produit.
    });
  }, [productId, enabled]);
}
