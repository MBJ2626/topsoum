import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Le lint tourne via sa propre etape CI (`pnpm turbo run lint`) ;
    // ne pas le dupliquer/faire echouer le build ici.
    ignoreDuringBuilds: true,
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
