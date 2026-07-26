import { NavItem, WorkspaceId, workspaceOptions } from "../../app/navigation";
import {
  NavSection,
  PersonaDefinition,
  navigationForPersona,
  personaForRoles,
} from "../../app/personas";
import { OperationalState } from "../../app/OperationalStates";

/**
 * W8 — the role-composed home / landing shell.
 *
 * FS_Dashboard v1.0 describes "a single role-composed shell (dashboard) that assembles a per-role
 * set of widgets". This is that shell's first form: it composes the session's persona and
 * permissions (W0 / ADR-006 D-COV-04) into a per-persona landing page — the destinations the
 * persona actually holds, grouped by section, as entry cards.
 *
 * It is pure composition. It reads no new backend and adds no schema — the persona model, the
 * navigation catalogue, and the session's permissions are the only inputs. Widget data-binding to
 * live aggregates (the PS14 KPI/task feeds named in FS §2.3) is the next increment; this form
 * establishes the composition and the per-persona scoping the FS requires.
 *
 * PH-05E: resolves its own empty / ready states.
 */

export interface HomeWorkspaceProps {
  navigation: readonly NavItem[];
  permissions: readonly string[];
  roles: readonly string[];
}

/** Ordered workspace labels for the section grouping header. */
const WORKSPACE_LABEL: Record<WorkspaceId, string> = {
  me: "Me",
  team: "My Team",
  admin: "Admin",
};

export function composeHome(
  navigation: readonly NavItem[],
  permissions: readonly string[],
  roles: readonly string[]
): { persona?: PersonaDefinition; sections: NavSection[]; workspaces: WorkspaceId[] } {
  const persona = personaForRoles(roles);
  const sections = navigationForPersona(navigation, permissions, persona);
  // The workspaces this session can enter at all, in canonical order.
  const workspaces = workspaceOptions
    .filter((option) => permissions.includes("*") || permissions.includes(option.requiredPermission))
    .map((option) => option.id);
  return { persona, sections, workspaces };
}

export function HomeWorkspace({ navigation, permissions, roles }: HomeWorkspaceProps) {
  const { persona, sections, workspaces } = composeHome(navigation, permissions, roles);

  if (sections.length === 0) {
    return (
      <OperationalState
        kind="empty"
        title="No destinations available"
        detail="This account has no permitted workspaces. Contact your administrator."
      />
    );
  }

  return (
    <article className="record-panel" aria-label="Home dashboard">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Home</p>
          <h2>{persona ? `${persona.label} workspace` : "Your workspace"}</h2>
        </div>
        <span className="text-xs text-gray-400">
          {workspaces.map((w) => WORKSPACE_LABEL[w]).join(" · ") || "—"}
        </span>
      </div>

      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        {persona
          ? `Composed for ${persona.label}. You see only the destinations your roles and permissions grant.`
          : "Composed from your permissions. Navigation reflects what you are permitted to reach."}
      </p>

      <div className="grid gap-5">
        {sections.map((section) => (
          <section key={section.section} aria-label={section.section}>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-heading)]">{section.section}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm hover:bg-gray-50/60"
                >
                  <span className="font-medium text-[var(--color-text)]">{item.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{item.href}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
