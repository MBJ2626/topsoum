import type { ReactNode } from "react";

/**
 * Conteneur des pages en cours de rendu serveur (loading.tsx) : meme colonne
 * que les pages, zone marquee occupee et annoncee aux lecteurs d'ecran.
 */
export function BusyMain({ children }: { children: ReactNode }) {
  return (
    <main aria-busy="true" className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-12 pt-4 sm:gap-5">
      <p role="status" className="sr-only">
        Chargement…
      </p>
      {children}
    </main>
  );
}
