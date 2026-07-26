import { useEffect, useState } from "react";
import {
  ConfigEntryRecord,
  ConfigRegistryDescriptor,
  HrmsApiError,
  HrmsClient,
} from "../../api/hrmsClient";
import { OperationalState } from "../../app/OperationalStates";
import { DataTable, DataTableColumnDef } from "../../components/ui/DataTable";
import { useDataTable } from "../../lib/useDataTable";
import { FormField } from "../../components/ui/Form";
import { useForm, required } from "../../lib/useForm";

/**
 * W1 — Org-Admin configuration registry workspace.
 *
 * One workspace renders EVERY configuration registry. It reads the registry descriptors from the
 * API and builds its table columns and its form fields from the declared attributes, so a new W1
 * screen is a descriptor on the server — no component per registry.
 *
 * PH-05E: this surface resolves its own loading, error, empty and ready states.
 */

type ViewState =
  | { kind: "loading" }
  | { kind: "error"; errorCode: string }
  | { kind: "no-permission"; errorCode: string }
  | { kind: "empty" }
  | { kind: "ready"; registries: ConfigRegistryDescriptor[] };

type EntriesState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; errorCode: string }
  | { kind: "empty" }
  | { kind: "ready"; entries: ConfigEntryRecord[] };

type SubmitPhase =
  | { kind: "idle" }
  | { kind: "error"; errorCode: string; message: string }
  | { kind: "success"; code: string };

const ENTRY_COLUMNS: DataTableColumnDef<ConfigEntryRecord, "code" | "name" | "status" | "version">[] = [
  { id: "code", header: "Code", resolve: (e) => <span className="font-medium">{e.code}</span>, sortValue: (e) => e.code },
  { id: "name", header: "Name", resolve: (e) => e.name, sortValue: (e) => e.name },
  {
    id: "status",
    header: "Status",
    resolve: (e) =>
      e.isActive ? (
        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">ACTIVE</span>
      ) : (
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">RETIRED</span>
      ),
    sortValue: (e) => (e.isActive ? 1 : 0),
    className: "text-center",
  },
  { id: "version", header: "Ver", resolve: (e) => <span className="tabular-nums">v{e.version}</span>, sortValue: (e) => e.version, className: "text-center" },
];

export async function loadRegistries(client: HrmsClient): Promise<ViewState> {
  try {
    const page = await client.listConfigRegistries();
    if (page.items.length === 0) return { kind: "empty" };
    return { kind: "ready", registries: page.items };
  } catch (error) {
    if (error instanceof HrmsApiError) {
      if (error.code === "FORBIDDEN") return { kind: "no-permission", errorCode: error.code };
      if (error.code === "NOT_FOUND") return { kind: "empty" };
      return { kind: "error", errorCode: error.code };
    }
    return { kind: "error", errorCode: "UNKNOWN_ERROR" };
  }
}

export interface ConfigRegistryWorkspaceProps {
  client: HrmsClient;
  initialState?: ViewState;
  initialEntries?: EntriesState;
}

export function ConfigRegistryWorkspace({ client, initialState, initialEntries }: ConfigRegistryWorkspaceProps) {
  const [state, setState] = useState<ViewState>(initialState ?? { kind: "loading" });
  const [selected, setSelected] = useState<string | undefined>(
    initialState?.kind === "ready" ? initialState.registries[0]?.key : undefined
  );
  const [entries, setEntries] = useState<EntriesState>(initialEntries ?? { kind: "idle" });
  const [phase, setPhase] = useState<SubmitPhase>({ kind: "idle" });
  const [tableState, tableCallbacks] = useDataTable<"code" | "name" | "status" | "version">();

  useEffect(() => {
    if (initialState) return;
    let mounted = true;
    void loadRegistries(client).then((next) => {
      if (!mounted) return;
      setState(next);
      if (next.kind === "ready") setSelected(next.registries[0]?.key);
    });
    return () => {
      mounted = false;
    };
  }, [client, initialState]);

  const descriptor = state.kind === "ready" ? state.registries.find((r) => r.key === selected) : undefined;

  useEffect(() => {
    if (initialEntries || !descriptor) return;
    let mounted = true;
    setEntries({ kind: "loading" });
    client
      .listConfigEntries(descriptor.key)
      .then((page) => {
        if (!mounted) return;
        setEntries(page.items.length === 0 ? { kind: "empty" } : { kind: "ready", entries: page.items });
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setEntries({ kind: "error", errorCode: error instanceof HrmsApiError ? error.displayCode : "UNKNOWN_ERROR" });
      });
    return () => {
      mounted = false;
    };
  }, [client, descriptor, initialEntries]);

  const form = useForm({
    code: { initial: "", validate: required("Code is required.") },
    name: { initial: "", validate: required("Name is required.") },
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    if (!descriptor) return;
    setPhase({ kind: "idle" });
    try {
      const result = await client.createConfigEntry(
        descriptor.key,
        { code: values.code, name: values.name },
        crypto.randomUUID()
      );
      setPhase({ kind: "success", code: result.entry.code });
      form.reset();
      const page = await client.listConfigEntries(descriptor.key);
      setEntries(page.items.length === 0 ? { kind: "empty" } : { kind: "ready", entries: page.items });
    } catch (error) {
      setPhase({
        kind: "error",
        errorCode: error instanceof HrmsApiError ? error.displayCode : "UNKNOWN_ERROR",
        message: error instanceof HrmsApiError ? error.message : "The configuration could not be saved.",
      });
    }
  });

  if (state.kind === "loading") {
    return <OperationalState kind="loading" title="Loading configuration" detail="Fetching the Org-Admin registries." />;
  }
  if (state.kind === "no-permission") {
    return <OperationalState kind="no-permission" title="No access to configuration" detail={`Error code ${state.errorCode}.`} />;
  }
  if (state.kind === "error") {
    return <OperationalState kind="error" title="Could not load configuration" detail={`Error code ${state.errorCode}.`} />;
  }
  if (state.kind === "empty") {
    return <OperationalState kind="empty" title="No registries configured" detail="No Org-Admin registries are available for this tenant." />;
  }

  return (
    <article className="record-panel" aria-label="Org-Admin configuration workspace">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Org Admin</p>
          <h2>Configuration registries</h2>
        </div>
        <span className="text-xs text-gray-400">{state.registries.length} registries</span>
      </div>

      <nav aria-label="Configuration registries" className="mb-4 flex flex-wrap gap-2">
        {state.registries.map((registry) => (
          <button
            key={registry.key}
            type="button"
            aria-current={registry.key === selected}
            onClick={() => {
              setSelected(registry.key);
              setPhase({ kind: "idle" });
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              registry.key === selected ? "border-blue-400 bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {registry.label}
          </button>
        ))}
      </nav>

      {descriptor && (
        <>
          <p className="mb-3 text-xs text-[var(--color-text-muted)]">
            Administers <code>{descriptor.table}</code>
            {descriptor.hierarchical ? " — hierarchical; parent cycles are rejected." : "."} Retiring an entry deactivates
            it; configuration is never deleted, because existing records still reference it.
          </p>

          <form aria-label={`Add ${descriptor.label}`} onSubmit={handleFormSubmit} className="mb-4 flex flex-wrap items-end gap-3">
            <FormField id="cfg-code" label="Code" error={form.touched.code ? form.errors.code : undefined}>
              <input
                id="cfg-code"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.values.code}
                onChange={(e) => form.setValue("code", e.target.value)}
              />
            </FormField>
            <FormField id="cfg-name" label="Name" error={form.touched.name ? form.errors.name : undefined}>
              <input
                id="cfg-name"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.values.name}
                onChange={(e) => form.setValue("name", e.target.value)}
              />
            </FormField>
            <button
              type="submit"
              disabled={form.isSubmitting}
              className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {form.isSubmitting ? "Saving…" : "Add entry"}
            </button>
          </form>

          {phase.kind === "error" && (
            <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {phase.errorCode}: {phase.message}
            </p>
          )}
          {phase.kind === "success" && (
            <p role="status" className="mb-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              {phase.code} added.
            </p>
          )}

          {entries.kind === "loading" && <OperationalState kind="loading" title="Loading entries" detail={`Fetching ${descriptor.label}.`} />}
          {entries.kind === "error" && <OperationalState kind="error" title="Could not load entries" detail={`Error code ${entries.errorCode}.`} />}
          {entries.kind === "empty" && <OperationalState kind="empty" title="No entries yet" detail={`No ${descriptor.label} are configured.`} />}
          {entries.kind === "ready" && (
            <DataTable
              items={entries.entries}
              columns={ENTRY_COLUMNS}
              state={tableState}
              callbacks={tableCallbacks}
              emptyMessage={`No ${descriptor.label} are configured.`}
            />
          )}
        </>
      )}
    </article>
  );
}
