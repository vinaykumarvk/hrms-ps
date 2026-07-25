import { ApiKernel, created, ok } from "../http/apiKernel";
import { optionalBoolean, optionalString, readBodyRecord, requiredString } from "../http/body";
import { RouteDefinition } from "../http/apiTypes";
import { ConfigRegistryKey } from "../modules/cfg/orgConfigRepository";
import { CONFIG_REGISTRIES } from "../modules/cfg/orgConfigService";
import { FoundationError } from "../platform/types";

/**
 * W1 — Org-Admin configuration registry routes.
 *
 * One route set serves every registry: the registry key is a path parameter validated against the
 * declared descriptors, so adding a W1 screen adds a descriptor, not an endpoint. Permissions are
 * still per-registry — the service resolves `cfg.<registry>.read|write` from the descriptor, so a
 * shared route never widens access.
 */

export const cfgRouteEvidence = {
  registries: "/api/v1/config/registries",
  entries: "/api/v1/config/registries/{registry}/entries",
  entry: "/api/v1/config/registries/{registry}/entries/{id}",
  deactivate: "/api/v1/config/registries/{registry}/entries/{id}:deactivate",
};

const VALID_KEYS = new Set<string>(CONFIG_REGISTRIES.map((r) => r.key));

function requiredParam(raw: string | undefined, field: string): string {
  if (!raw) {
    throw new FoundationError("VALIDATION_FAILED", `${field} is required`, { field });
  }
  return raw;
}

function registryParam(raw: string | undefined): ConfigRegistryKey {
  if (!raw || !VALID_KEYS.has(raw)) {
    throw new FoundationError("NOT_FOUND", "Unknown configuration registry", { field: "registry" });
  }
  return raw as ConfigRegistryKey;
}

/** Attributes arrive as an open bag; only declared keys survive the service's validation. */
function readAttributes(body: Record<string, unknown>): Record<string, string | number | boolean | undefined> {
  const raw = body.attributes;
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new FoundationError("VALIDATION_FAILED", "attributes must be an object", { field: "attributes" });
  }
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function registerCfgRoutes(kernel: ApiKernel): void {
  const routes: RouteDefinition[] = [
    {
      method: "GET",
      path: "/api/v1/config/registries",
      operationId: "cfg.listRegistries",
      protected: true,
      permission: "cfg.registry.read",
      handler: (context) => ok({ items: context.services.orgConfig.listRegistries() }),
    },
    {
      method: "GET",
      path: "/api/v1/config/registries/{registry}/entries",
      operationId: "cfg.listEntries",
      protected: true,
      permission: "cfg.registry.read",
      handler: (context) =>
        ok({ items: context.services.orgConfig.list(context.actor, registryParam(context.params.registry)) }),
    },
    {
      method: "POST",
      path: "/api/v1/config/registries/{registry}/entries",
      operationId: "cfg.createEntry",
      protected: true,
      permission: "cfg.registry.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          entry: context.services.orgConfig.create(context.actor, registryParam(context.params.registry), {
            code: requiredString(body, "code"),
            name: requiredString(body, "name"),
            isActive: optionalBoolean(body, "isActive"),
            parentId: optionalString(body, "parentId"),
            attributes: readAttributes(body),
          }),
        });
      },
    },
    {
      method: "PUT",
      path: "/api/v1/config/registries/{registry}/entries/{id}",
      operationId: "cfg.updateEntry",
      protected: true,
      permission: "cfg.registry.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        const expected = body.expectedVersion;
        return ok({
          entry: context.services.orgConfig.update(
            context.actor,
            registryParam(context.params.registry),
            requiredParam(context.params.id, "id"),
            {
              code: requiredString(body, "code"),
              name: requiredString(body, "name"),
              isActive: optionalBoolean(body, "isActive"),
              parentId: optionalString(body, "parentId"),
              attributes: readAttributes(body),
              expectedVersion: typeof expected === "number" ? expected : undefined,
            }
          ),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/config/registries/{registry}/entries/{id}:deactivate",
      operationId: "cfg.deactivateEntry",
      protected: true,
      permission: "cfg.registry.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) =>
        ok({
          entry: context.services.orgConfig.deactivate(
            context.actor,
            registryParam(context.params.registry),
            requiredParam(context.params.id, "id")
          ),
        }),
    },
  ];
  for (const route of routes) kernel.register(route);
}
