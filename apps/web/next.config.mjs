import { withSentryConfig } from "@sentry/nextjs";

import { PRODUCT_IMAGE_HOSTS } from "./lib/image-hosts.mjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Le lint tourne via sa propre etape CI (`pnpm turbo run lint`) ;
    // ne pas le dupliquer/faire echouer le build ici.
    ignoreDuringBuilds: true,
  },
  images: {
    // Photos produit des vendeurs, servies redimensionnees depuis notre domaine.
    remotePatterns: PRODUCT_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname, pathname: "/**" })),
    formats: ["image/avif", "image/webp"],
    // Les photos produit changent rarement : 24 h de cache au lieu de 60 s par
    // defaut, pour ne pas re-telecharger sans cesse chez les vendeurs.
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        // Le navigateur doit toujours revalider sw.js, sinon une nouvelle
        // version du service worker peut mettre longtemps a etre prise.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Pas d'upload de source maps sans token (dev local / DSN non configure).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
