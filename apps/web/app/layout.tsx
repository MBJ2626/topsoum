import "./globals.css";

import type { Metadata, Viewport } from "next";

import { ACCENT_COLOR } from "@/lib/theme";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TopSoum — Comparateur de prix électronique en Tunisie",
  description: "Le meilleur prix des telephones, PC et TV chez les revendeurs tunisiens.",
  manifest: "/manifest.json",
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
