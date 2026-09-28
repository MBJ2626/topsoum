import "./globals.css";

import type { Metadata, Viewport } from "next";

import { BASE_OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/site";
import { ACCENT_COLOR } from "@/lib/theme";

import { Providers } from "./providers";

const DEFAULT_TITLE = "TopSoum — Comparateur de prix électronique en Tunisie";
const DEFAULT_DESCRIPTION =
  "Comparez les prix des téléphones, PC et TV chez les revendeurs tunisiens et trouvez le meilleur prix.";

// Pas d'alternates.canonical ni d'openGraph.url ici : ils seraient herites par
// toutes les pages. Chaque page indexable declare sa propre URL canonique.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s — ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: ACCENT_COLOR,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
