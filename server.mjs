// Production server for the PrimeSoft HRMS standalone deployment (Cloud Run).
//
// Serves the built SPA (dist/apps/web) and routes same-origin /api/* to the
// in-process HRMS kernel (dist/apps/api). Listens on $PORT (Cloud Run contract).
//
// On boot, if DATABASE_URL is set, it connects and applies the SQL migrations in
// apps/api/db/migrations so the schema is present in the attached database. The
// application logic itself uses in-memory repositories (see foundationServices);
// the database is wired at the infrastructure level and schema-migrated, ready
// for a future persistence layer. Migration failures are logged, not fatal — the
// app stays available regardless of database state.
//
// NOTE: bearer tokens are decoded, not signature-verified (inherited from the
// PH-05B out-of-band identity caveat). Suitable for a demo deployment only.

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = fileURLToPath(new URL(".", import.meta.url));
const api = require(join(here, "dist/apps/api/src/index.js"));

const PORT = Number(process.env.PORT ?? 8080);
const WEB_ROOT = join(here, "dist/apps/web");
const MIGRATIONS_DIR = join(here, "apps/api/db/migrations");

const kernel = api.createFoundationApi(api.createFoundationServices());

// ---- optional migration-on-boot (non-fatal) ---------------------------------
async function migrateIfConfigured() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipping migrations (app runs in-memory).");
    return;
  }
  let pool;
  try {
    pool = api.createDatabasePool();
    const applied = await api.runMigrations(pool, MIGRATIONS_DIR);
    console.log(`DB connected. Migrations applied this boot: ${applied.length}` +
      (applied.length ? ` [${applied.join(", ")}]` : " (schema already current)"));
  } catch (error) {
    console.error("DB migration/connect failed (continuing, app is in-memory):", error?.message ?? error);
  } finally {
    try { await pool?.end(); } catch { /* ignore */ }
  }
}

// ---- API actor decoding (mirrors tools/local-api-server.mjs) -----------------
function decodeActor(authorizationHeader) {
  if (!authorizationHeader?.startsWith("Bearer ")) return undefined;
  const token = authorizationHeader.slice("Bearer ".length);
  const segments = token.split(".");
  if (segments.length !== 3) return undefined;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
  if (typeof claims.sub !== "string" || !Array.isArray(claims.permissions)) return undefined;
  return {
    tenantId: typeof claims.tenantId === "string" ? claims.tenantId : api.ph03Ids.tenant,
    entityId: typeof claims.entityId === "string" ? claims.entityId : api.ph03Ids.entity,
    userId: claims.sub,
    actorUserId: claims.sub,
    roles: Array.isArray(claims.roles) ? claims.roles : [],
    permissions: claims.permissions.filter((p) => typeof p === "string"),
    fieldGrants: Array.isArray(claims.fieldGrants) ? claims.fieldGrants : [],
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function handleApi(req, res, url) {
  return readBody(req).then((raw) => {
    let body;
    if (raw.length > 0) {
      try { body = JSON.parse(raw); }
      catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { code: "VALIDATION_FAILED", message: "Request body is not valid JSON" } }));
        return;
      }
    }
    const query = {};
    for (const [k, v] of url.searchParams) query[k] = v;
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v[0] : v;

    const response = kernel.dispatch({
      method: req.method,
      path: url.pathname,
      headers,
      query,
      body,
      actor: decodeActor(req.headers.authorization),
    });
    res.writeHead(response.status, { "Content-Type": "application/json", ...response.headers });
    res.end(response.body === undefined ? "" : JSON.stringify(response.body));
  });
}

// ---- static SPA serving with history-API fallback ---------------------------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".map": "application/json",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8",
};

async function serveStatic(res, pathname) {
  // Resolve within WEB_ROOT; fall back to index.html for SPA routes.
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(WEB_ROOT, safe);
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    filePath = join(WEB_ROOT, "index.html"); // SPA fallback
  }
  try {
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    const cache = filePath.includes(`${join("dist/apps/web", "assets")}`) || filePath.includes("/assets/")
      ? "public, max-age=31536000, immutable" : "no-cache";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(res, url.pathname);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { code: "INTERNAL", message: String(error?.message ?? error) } }));
  }
});

await migrateIfConfigured();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`PrimeSoft HRMS listening on :${PORT} (API base ${api.API_BASE_PATH})`);
});
