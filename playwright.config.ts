import { defineConfig, devices } from "@playwright/test";

// The tests start their own server on port 3100 with a throwaway data folder and build folder,
// so they never touch your real data or a dev server you already have running.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // desktop and Android phone run in the installed Google Chrome — no browser download needed
    { name: "desktop", testMatch: /\.(desktop|shared)\.spec\.ts$/, use: { channel: "chrome", viewport: { width: 1280, height: 900 } } },
    { name: "phone", testMatch: /\.(phone|shared)\.spec\.ts$/, use: { ...devices["Pixel 7"], channel: "chrome" } },
    // Safari's engine (WebKit) at iPhone size — run once `npx playwright install webkit` has been done
    { name: "iphone", testMatch: /\.(ios|shared)\.spec\.ts$/, use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: `rm -rf .test-data && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/auth/providers`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATA_DIR: ".test-data",
      NEXT_DIST_DIR: ".next-test",
      // never talk to a real database or email service from tests
      DATABASE_URL: "", POSTGRES_URL: "", KV_REST_API_URL: "", KV_REST_API_TOKEN: "",
      UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", RESEND_API_KEY: "",
    },
  },
});
