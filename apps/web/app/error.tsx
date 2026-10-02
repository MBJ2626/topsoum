"use client";

import { Button } from "@/components/ui/Button";

// Message fixe : error.message peut etre technique ou en anglais ("Failed to fetch").
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <div className="flex flex-col items-start gap-4 rounded-card border border-gray-200 bg-white p-6 sm:p-10">
        <h1 className="text-balance text-[1.75rem] font-medium leading-tight tracking-display text-gray-900 sm:text-4xl">
          Cette page n&apos;a pas pu s&apos;afficher.
        </h1>
        <p className="max-w-[50ch] text-base text-gray-600">
          Un problème est survenu de notre côté ou sur le réseau. Vous pouvez réessayer.
        </p>
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </main>
  );
}
