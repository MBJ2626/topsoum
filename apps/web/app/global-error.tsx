"use client";

import "./globals.css";

// Ne se declenche que si le layout racine lui-meme plante (ex: Providers) :
// doit donc redefinir <html>/<body>, jamais d'ecran blanc meme dans ce cas.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="bg-white text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-base font-medium text-gray-900">TopSoum est temporairement indisponible.</p>
          <p className="text-sm text-gray-500">Merci de reessayer dans un instant.</p>
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] min-w-[44px] rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground"
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
