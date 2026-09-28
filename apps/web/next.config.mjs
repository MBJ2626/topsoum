import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Le lint tourne via sa propre etape CI (`pnpm turbo run lint`) ;
    // ne pas le dupliquer/faire echouer le build ici.
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Pas d'upload de source maps sans token (dev local / DSN non configure).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
