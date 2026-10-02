import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Readex_Pro } from "next/font/google";

import { BASE_OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/site";

import { Providers } from "./providers";
import { SiteHeader } from "./site-header";

// Une seule famille (400/500). Readex Pro couvre aussi l'arabe : la future
// version RTL n'aura pas a changer de police (seul le sous-ensemble change).
const sans = Readex_Pro({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const DEFAULT_TITLE = "TopSoum | Comparateur de prix électronique en Tunisie";
const DEFAULT_DESCRIPTION =
  "Comparez les prix des téléphones, PC et TV chez les revendeurs tunisiens et trouvez le meilleur prix.";

// Pas d'alternates.canonical ni d'openGraph.url ici : ils seraient herites par
// toutes les pages. Chaque page indexable declare sa propre URL canonique.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  // Declare l'icone : sans <link rel="icon">, le navigateur demande
  // /favicon.ico, inexistant (404 dans la console).
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml" } },
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
  // Barre du navigateur couleur etagere : l'accent reste reserve a l'action.
  themeColor: "#eef0f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={sans.variable}>
      <body className="bg-gray-100 font-sans text-gray-900 antialiased">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
