import { defineConfig, devices } from "@playwright/test";

const MOCK_API_PORT = 4310;
const WEB_PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `node e2e/mock-api-server.mjs`,
      port: MOCK_API_PORT,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec next build && pnpm exec next start -p ${WEB_PORT}`,
      port: WEB_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: {
        API_BASE_URL: `http://localhost:${MOCK_API_PORT}`,
        DATABASE_URL: "postgresql://topsoum:topsoum@localhost:5432/topsoum_e2e_placeholder?schema=public",
        AUTH_SECRET: "e2e-test-secret-not-used-for-anything-real",
        AUTH_URL: `http://localhost:${WEB_PORT}`,
      },
    },
  ],
});
