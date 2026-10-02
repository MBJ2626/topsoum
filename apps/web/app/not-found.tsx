import type { Metadata } from "next";

import Link from "next/link";

import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false, follow: false } };

// 404 dans le meme monde que le reste du site (jamais la page anglaise par defaut).
export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <div className="flex flex-col items-start gap-4 rounded-card border border-gray-200 bg-white p-6 sm:p-10">
        <h1 className="text-balance text-[1.75rem] font-medium leading-tight tracking-display text-gray-900 sm:text-4xl">
          Cette page n&apos;existe pas.
        </h1>
        <p className="max-w-[50ch] text-base text-gray-600">
          Le lien est peut-être ancien ou mal copié. Cherchez directement le produit, ou revenez à l&apos;accueil.
        </p>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
