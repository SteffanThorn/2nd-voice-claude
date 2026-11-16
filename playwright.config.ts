import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: drive a real browser against the running app.
// Run with `npm run test:e2e`. It builds the app and serves the production
// build on port 3210, so it doesn't clash with a dev server you have open.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://localhost:3210", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx next build && npx next start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: false,
    // eSpeak needs no key, so e2e tests can exercise real audio playback.
    env: { ESPEAK_NG_ENABLED: "true" },
    timeout: 300_000,
  },
});
