"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-base font-medium text-gray-900">Une erreur inattendue est survenue.</p>
      <p className="text-sm text-gray-500">{error.message || "Merci de réessayer."}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
