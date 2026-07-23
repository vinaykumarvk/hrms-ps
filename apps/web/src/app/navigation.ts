export type WorkspaceId = "me" | "team" | "admin";

export interface WorkspaceOption {
  id: WorkspaceId;
  label: "Me" | "My Team" | "Admin";
  requiredPermission: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  workspace: WorkspaceId;
  icon: string;
  requiredPermission: string;
}

export const workspaceOptions: WorkspaceOption[] = [
  { id: "me", label: "Me", requiredPermission: "workspace.me" },
  { id: "team", label: "My Team", requiredPermission: "workspace.team" },
  { id: "admin", label: "Admin", requiredPermission: "workspace.admin" },
];

// One navigation entry per BRD module workspace (PS01-PS14), plus the workflow
// inbox and configuration console. Each entry carries the module's read
// permission from the API permission families (gNN.* prefixes) so the shell
// only shows destinations the session actually grants.
export const primaryNavigation: NavItem[] = [
  { id: "inbox", label: "Inbox", href: "/me/inbox", workspace: "me", icon: "inbox", requiredPermission: "p01.workflow.read" },
  { id: "employees", label: "Employees", href: "/me/employees", workspace: "me", icon: "users", requiredPermission: "ps01.employee.read" },
  { id: "personal-details", label: "Personal Details", href: "/me/personal-details", workspace: "me", icon: "user-round-pen", requiredPermission: "ps02.change.read" },
  { id: "attendance-leave", label: "Attendance & Leave", href: "/me/attendance-leave", workspace: "me", icon: "calendar-days", requiredPermission: "ps03.leave.read" },
  { id: "service-register", label: "Service Register", href: "/me/service-register", workspace: "me", icon: "book-open", requiredPermission: "ps12.sr.read" },
  { id: "documents", label: "Documents", href: "/me/documents", workspace: "me", icon: "folder-lock", requiredPermission: "ps13.document.read" },
  { id: "transfers", label: "Transfers", href: "/team/transfers", workspace: "team", icon: "arrow-left-right", requiredPermission: "ps05.transfer.read" },
  { id: "promotions", label: "Promotions", href: "/team/promotions", workspace: "team", icon: "badge-up", requiredPermission: "ps06.promotion.read" },
  { id: "training", label: "Training", href: "/team/training", workspace: "team", icon: "graduation-cap", requiredPermission: "ps07.training.read" },
  { id: "apar", label: "APAR", href: "/team/apar", workspace: "team", icon: "clipboard-check", requiredPermission: "ps08.apar.read" },
  { id: "disciplinary", label: "Disciplinary", href: "/team/disciplinary", workspace: "team", icon: "scale", requiredPermission: "ps09.case.read" },
  { id: "leave-sr-relay", label: "Leave-SR Relay", href: "/admin/leave-sr-relay", workspace: "admin", icon: "refresh-cw", requiredPermission: "ps04.relay.read" },
  { id: "payroll", label: "Payroll", href: "/admin/payroll", workspace: "admin", icon: "indian-rupee", requiredPermission: "ps10.payroll.read" },
  { id: "pension-retirement", label: "Pension & Retirement", href: "/admin/pension-retirement", workspace: "admin", icon: "landmark", requiredPermission: "ps11.pension.read" },
  { id: "analytics", label: "Analytics", href: "/admin/analytics", workspace: "admin", icon: "chart-no-axes-combined", requiredPermission: "ps14.analytics.read" },
  { id: "workflow-config", label: "Workflow Config", href: "/admin/workflow-config", workspace: "admin", icon: "workflow", requiredPermission: "p01.workflow.config.review" },
];

export function workspaceForPath(pathname: string): WorkspaceId {
  if (pathname.startsWith("/team/")) return "team";
  if (pathname.startsWith("/admin/")) return "admin";
  return "me";
}

export function canAccess(permissions: readonly string[], requiredPermission: string): boolean {
  return permissions.includes("*") || permissions.includes(requiredPermission);
}
