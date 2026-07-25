/**
 * E2E preflight — fail fast when a port the Playwright webServers need is already taken.
 *
 * Why this exists (URF-00R, from finding FR-11a):
 * apps/web/playwright.config.ts sets `reuseExistingServer: false` on both webServer entries.
 * That was the FR-11 repair — it stops a stale server from serving a gate run. But it also
 * means that if anything else holds 5173 or 8787, Playwright waits on a URL it will never own
 * and the run hangs with no output until its 120s-per-server timeout, twice, producing no
 * diagnostic. During URF-00 that cost a full e2e gate: a developer's dev server held 5173 and
 * the run produced zero test output.
 *
 * A gate that cannot run must say so immediately and name the cause.
 */
import net from "node:net";

// Ports mirror apps/web/playwright.config.ts. Override both together to run the gate out of the
// way of a dev server: E2E_WEB_PORT=5199 E2E_API_PORT=8799 npm run web:test:e2e
const PORTS = [
  { port: Number(process.env.E2E_WEB_PORT ?? 5173), who: "the Vite web server (npm run web:dev)" },
  { port: Number(process.env.E2E_API_PORT ?? 8787), who: "the local API bridge (tools/local-api-server.mjs)" },
];

function inUse(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", (err) => resolve(err.code === "EADDRINUSE"));
    probe.once("listening", () => probe.close(() => resolve(false)));
    probe.listen(port, "127.0.0.1");
  });
}

const taken = [];
for (const entry of PORTS) {
  if (await inUse(entry.port)) taken.push(entry);
}

if (taken.length > 0) {
  const lines = taken.map((t) => `  - port ${t.port} is in use, needed by ${t.who}`);
  process.stderr.write(
    [
      "",
      "E2E preflight FAILED — a required port is already in use.",
      ...lines,
      "",
      "The Playwright config sets reuseExistingServer:false, so it will not share an existing",
      "server; without this check the run hangs silently until it times out.",
      "",
      "Fix: stop whatever holds the port, then re-run. To find it:",
      ...taken.map((t) => `  lsof -nP -iTCP:${t.port} -sTCP:LISTEN`),
      "",
      "Or run the gate on isolated ports instead, leaving the other server alone:",
      "  E2E_WEB_PORT=5199 E2E_API_PORT=8799 npm run web:test:e2e",
      "",
    ].join("\n")
  );
  process.exit(1);
}

process.stdout.write("e2e preflight ok — ports 5173 and 8787 are free\n");
