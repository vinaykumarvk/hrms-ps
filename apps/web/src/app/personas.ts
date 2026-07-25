/**
 * W0 / D-COV-04 — the persona catalogue and persona-driven navigation resolver.
 *
 * The prototype (docs/HRMS Deliverables to Development Phase/prototype_hrms.html) drives its
 * navigation from `NAV[role]`: a per-persona list of sections, each holding items. It declares 22
 * personas and 226 unique screens. The built shell hardcoded 16 items across three workspaces.
 *
 * With 226 screens ahead, adding a screen has to be a data change rather than a shell edit, so
 * this module holds the persona model and a resolver; `navigation.ts` holds the items. Each wave
 * adds items and tags them with the personas and section they belong to — no code here changes.
 *
 * Authorization boundary, restated because it is easy to erode: this decides what is OFFERED.
 * RouteGuard and the API decide what is PERMITTED. A persona seeing an item is never a grant, and
 * every item is still filtered by the session's permissions before it is shown.
 */

import { NavItem, canAccess } from "./navigation";

export type PersonaId =
  | "employee"
  | "manager_l1"
  | "hod"
  | "hr_admin"
  | "separation_admin"
  | "hrbp"
  | "office_admin"
  | "finance_admin"
  | "onboarding_admin"
  | "leave_admin"
  | "attendance_admin"
  | "performance_admin"
  | "document_admin"
  | "recruiter"
  | "recruitment_admin"
  | "org_admin"
  | "platform_super_admin"
  | "candidate"
  | "it_admin"
  | "service_desk_admin"
  | "service_desk_agent"
  | "ceo";

export interface PersonaDefinition {
  id: PersonaId;
  label: string;
  /**
   * Self-service personas keep the "Self" section; admin personas do not. This mirrors the
   * prototype's resolved OPEN-FS-FND-05: "Admin workspaces are exclusive — an admin role shows
   * only admin functions, not the employee Self self-service section."
   */
  selfService: boolean;
  /** True for the only pre-hire actor; it can reach onboarding surfaces but holds no employee record. */
  preHire?: boolean;
}

/** All 22 personas declared by the prototype's NAV, in its own order. */
export const personaCatalogue: readonly PersonaDefinition[] = [
  { id: "employee", label: "Employee", selfService: true },
  { id: "manager_l1", label: "Manager (L1)", selfService: true },
  { id: "hod", label: "Head of Department", selfService: true },
  { id: "hr_admin", label: "HR Admin", selfService: false },
  { id: "separation_admin", label: "Separation Admin", selfService: false },
  { id: "hrbp", label: "HR Business Partner", selfService: false },
  { id: "office_admin", label: "Office Admin", selfService: false },
  { id: "finance_admin", label: "Finance Admin", selfService: false },
  { id: "onboarding_admin", label: "Onboarding Admin", selfService: false },
  { id: "leave_admin", label: "Leave Admin", selfService: false },
  { id: "attendance_admin", label: "Attendance Admin", selfService: false },
  { id: "performance_admin", label: "Performance Admin", selfService: false },
  { id: "document_admin", label: "Document Admin", selfService: false },
  { id: "recruiter", label: "Recruiter", selfService: false },
  { id: "recruitment_admin", label: "Recruitment Admin", selfService: false },
  { id: "org_admin", label: "Org Admin", selfService: false },
  { id: "platform_super_admin", label: "Platform Super Admin", selfService: false },
  { id: "candidate", label: "Candidate", selfService: true, preHire: true },
  { id: "it_admin", label: "IT Admin", selfService: false },
  { id: "service_desk_admin", label: "Service Desk Admin", selfService: false },
  { id: "service_desk_agent", label: "Service Desk Agent", selfService: false },
  { id: "ceo", label: "CEO", selfService: true },
];

const personaById = new Map<PersonaId, PersonaDefinition>(personaCatalogue.map((p) => [p.id, p]));

export function findPersona(id: string): PersonaDefinition | undefined {
  return personaById.get(id as PersonaId);
}

/**
 * Resolves the session's persona from its roles. The first role matching a catalogue persona
 * wins; an unrecognised role yields undefined, and the caller falls back to the permission-only
 * navigation rather than inventing a persona.
 */
export function personaForRoles(roles: readonly string[]): PersonaDefinition | undefined {
  for (const role of roles) {
    const persona = personaById.get(role as PersonaId);
    if (persona) return persona;
  }
  return undefined;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

/** The section a nav item belongs to; items predating the persona model default to "Workspace". */
export const DEFAULT_SECTION = "Workspace";
export const SELF_SECTION = "Self";

/**
 * Groups the navigable items for a persona into ordered sections.
 *
 * Two filters apply, in this order:
 *   1. persona scope — an item tagged with personas is offered only to those personas; an
 *      untagged item is offered to all, which keeps every pre-persona item working unchanged.
 *   2. permission — the session must actually hold the item's required permission.
 *
 * Admin personas additionally drop the Self section (prototype OPEN-FS-FND-05).
 */
export function navigationForPersona(
  items: readonly NavItem[],
  permissions: readonly string[],
  persona?: PersonaDefinition
): NavSection[] {
  const offered = items.filter((item) => {
    if (persona && item.personas && !item.personas.includes(persona.id)) return false;
    return canAccess(permissions, item.requiredPermission);
  });

  const sections: NavSection[] = [];
  const byName = new Map<string, NavSection>();
  for (const item of offered) {
    const name = item.section ?? DEFAULT_SECTION;
    if (persona && !persona.selfService && name === SELF_SECTION) continue;
    let section = byName.get(name);
    if (!section) {
      section = { section: name, items: [] };
      byName.set(name, section);
      sections.push(section);
    }
    section.items.push(item);
  }
  return sections;
}
