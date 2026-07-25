import { defineConfig, devices } from "@playwright/test";

/**
 * URF-00R (finding FR-11a): the gate binds configurable ports.
 *
 * `reuseExistingServer: false` is the FR-11 repair — it stops a stale server from serving a gate
 * run. But with the ports hardcoded, the gate became unrunnable whenever anything else held 5173
 * or 8787, which is what cost URF-00 its e2e evidence. The fix the finding called for was
 * isolated ports, not server reuse: set E2E_WEB_PORT / E2E_API_PORT to move the run out of the
 * way of a developer's dev server without weakening isolation.
 *
 *   E2E_WEB_PORT=5199 E2E_API_PORT=8799 npm run web:test:e2e
 *
 * Both servers already honour their own env: the bridge reads PORT, and the Vite proxy reads
 * HRMS_LOCAL_API_URL. `--strictPort` makes Vite fail loudly rather than silently drifting to
 * another port and leaving Playwright waiting on a URL nobody is serving.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5173);
const API_PORT = Number(process.env.E2E_API_PORT ?? 8787);
const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [["list"]],
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run build && node tools/local-api-server.mjs",
      cwd: "../..",
      env: { PORT: String(API_PORT) },
      url: `${API_URL}/api/v1/workflow/tasks`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run web:dev -- --port ${WEB_PORT} --strictPort`,
      cwd: "../..",
      env: { HRMS_LOCAL_API_URL: API_URL },
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
