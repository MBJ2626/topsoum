"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * router.push dans une transition : `pending` reste vrai jusqu'a l'affichage
 * de la page suivante (rendue cote serveur), pour un retour immediat au tap.
 */
export function usePendingNavigation(): { pending: boolean; navigate: (url: string) => void } {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return { pending, navigate: (url) => startTransition(() => router.push(url)) };
}
