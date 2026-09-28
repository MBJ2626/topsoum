"use client";

import { useEffect } from "react";

// Enregistre public/sw.js en production uniquement : en dev, un service
// worker qui met en cache les assets interfererait avec le rechargement a chaud.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sans service worker, le site reste pleinement utilisable en ligne :
        // pas d'erreur a remonter a l'utilisateur.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
