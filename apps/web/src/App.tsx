import { createHrmsClient } from "./api/hrmsClient";
import { AppShell } from "./app/AppShell";
import { LoginPanel } from "./app/LoginPanel";
import { RouteGuard } from "./app/RouteGuard";
import { endSession, HrmsSession, readSessionMessage, readStoredSession, startEmployeeSession } from "./app/session";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { primaryNavigation, workspaceForPath, WorkspaceId } from "./app/navigation";
import { WorkflowWorkspace } from "./workflow/WorkflowWorkspace";
import { WorkflowConfigConsole } from "./workflow/WorkflowConfigConsole";
import { ConfigRegistryWorkspace } from "./modules/cfg/ConfigRegistryWorkspace";
import { EmployeeProfile } from "./modules/ps01/EmployeeProfile";
import { EmployeeContactsPanel } from "./modules/ps01/EmployeeContactsPanel";
import { EmployeeDependentsPanel } from "./modules/ps01/EmployeeDependentsPanel";
import { PrivacyConsole } from "./modules/ps01/PrivacyConsole";
import { PersonalDetailsWorkspace } from "./modules/ps02/PersonalDetailsWorkspace";
import { ChangeRequestEditor } from "./modules/ps02/ChangeRequestEditor";
import { ChangeRequestApproverQueue } from "./modules/ps02/ChangeRequestApproverQueue";
import { LeaveWorkspace } from "./modules/ps03/LeaveWorkspace";
import { SelfServiceSummary } from "./modules/ps03/SelfServiceSummary";
import { LeaveSrRelayWorkspace } from "./modules/ps04/LeaveSrRelayWorkspace";
import { TransferWorkspace } from "./modules/ps05/TransferWorkspace";
import { CounsellingConsole } from "./modules/ps05/CounsellingConsole";
import { PromotionWorkspace } from "./modules/ps06/PromotionWorkspace";
import { DpcConvenePanel } from "./modules/ps06/DpcConvenePanel";
import { SealedCoverReview } from "./modules/ps06/SealedCoverReview";
import { TrainingWorkspace } from "./modules/ps07/TrainingWorkspace";
import { TrainingNominationForm } from "./modules/ps07/TrainingNominationForm";
import { AparWorkspace } from "./modules/ps08/AparWorkspace";
import { AparTierForms } from "./modules/ps08/AparTierForms";
import { DisciplinaryWorkspace } from "./modules/ps09/DisciplinaryWorkspace";
import { DisciplinaryCaseWorkbench } from "./modules/ps09/DisciplinaryCaseWorkbench";
import { EvidenceVaultList } from "./modules/ps09/EvidenceVaultList";
import { PayrollWorkspace } from "./modules/ps10/PayrollWorkspace";
import { PayrollRunConsole } from "./modules/ps10/PayrollRunConsole";
import { PensionWorkspace } from "./modules/ps11/PensionWorkspace";
import { PensionCaseConsole } from "./modules/ps11/PensionCaseConsole";
import { AnalyticsWorkspace } from "./modules/ps14/AnalyticsWorkspace";
import { EmbeddedBiDashboard } from "./modules/ps14/EmbeddedBiDashboard";
import { ServiceRegisterTimeline } from "./modules/ps12/ServiceRegisterTimeline";
import { DocumentVaultView } from "./modules/ps13/DocumentVaultView";
import { DataSubjectRequestConsole } from "./modules/ps13/DataSubjectRequestConsole";

// Composition root: the real fetch client. Base URL comes from Vite env
// configuration (empty string = same-origin). The token provider reads the
// session token persisted by the PH-05B login flow (app/session.ts); requests
// go out unauthenticated when no session exists. Every module workspace
// receives this client and resolves its own loading/error/empty/ready state
// (the canonical PH-05E pattern).
const client = createHrmsClient({
  baseUrl: (import.meta.env.VITE_HRMS_API_BASE_URL as string | undefined) ?? "",
  tokenProvider: () => window.sessionStorage.getItem("hrms.session.token"),
  onUnauthorized: () => window.dispatchEvent(new Event("hrms:unauthorized")),
});

export function App() {
  const [session, setSession] = useState<HrmsSession | null>(() => readStoredSession(window.sessionStorage));
  const [loginMessage, setLoginMessage] = useState<string | null>(() => readSessionMessage(window.sessionStorage));
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  // PH-07E: the PS02 editor and approver queue share a refresh token so a newly
  // created change request appears in the queue without a full reload.
  const [ps02QueueRefresh, setPS02QueueRefresh] = useState(0);
  const bumpPS02Queue = useCallback(() => setPS02QueueRefresh((token) => token + 1), []);

  const handleSignIn = useCallback((employeeId: string, password: string): boolean => {
    const nextSession = startEmployeeSession(window.sessionStorage, employeeId, password);
    if (nextSession) {
      setSession(nextSession);
      setLoginMessage(null);
    }
    return nextSession !== null;
  }, []);

  const handleSignOut = useCallback(() => {
    endSession(window.sessionStorage);
    setSession(null);
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!session) return;
    const expire = () => {
      endSession(window.sessionStorage);
      window.sessionStorage.setItem("hrms.session.message", "Your session ended. Sign in again to continue safely.");
      setSession(null);
      setLoginMessage("Your session ended. Sign in again to continue safely.");
    };
    const handleUnauthorized = () => expire();
    window.addEventListener("hrms:unauthorized", handleUnauthorized);
    const delay = session.expiresAt === undefined ? undefined : Math.max(0, session.expiresAt - Date.now());
    const timer = delay === undefined ? undefined : window.setTimeout(expire, delay);
    return () => {
      window.removeEventListener("hrms:unauthorized", handleUnauthorized);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [session]);

  const permissions = session?.permissions ?? [];

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const changeWorkspace = (workspace: WorkspaceId) => {
    const destination = primaryNavigation.find((item) => item.workspace === workspace && permissions.includes(item.requiredPermission));
    if (destination) navigate(destination.href);
  };

  const effectivePath = currentPath === "/" && session ? defaultPath(permissions) : currentPath;

  useEffect(() => {
    if (session && currentPath === "/" && effectivePath !== "/") window.history.replaceState({}, "", effectivePath);
  }, [currentPath, effectivePath, session]);

  useEffect(() => {
    if (session && currentPath !== "/") document.getElementById("route-heading")?.focus();
  }, [currentPath, session]);

  if (!session) {
    return <LoginPanel message={loginMessage} onSignIn={handleSignIn} />;
  }

  return (
    <AppShell
      activePath={effectivePath}
      activeWorkspace={workspaceForPath(effectivePath)}
      onNavigate={navigate}
      onSignOut={handleSignOut}
      onWorkspaceChange={changeWorkspace}
      permissions={permissions}
      sessionUser={session.displayName}
    >
      {renderRoute(effectivePath, permissions, ps02QueueRefresh, bumpPS02Queue, navigate)}
    </AppShell>
  );
}

function defaultPath(permissions: readonly string[]): string {
  return primaryNavigation.find((item) => permissions.includes(item.requiredPermission))?.href ?? "/no-permission";
}

function routePage(label: string, permission: string, permissions: readonly string[], content: ReactNode): ReactNode {
  return (
    <section aria-labelledby="route-heading" className="route-page">
      <h2 className="route-title" id="route-heading" tabIndex={-1}>{label}</h2>
      <RouteGuard permissions={permissions} requiredPermission={permission} routeLabel={label}>
        <div className="workspace-grid">{content}</div>
      </RouteGuard>
    </section>
  );
}

function renderRoute(path: string, permissions: readonly string[], refresh: number, bump: () => void, navigate: (path: string) => void): ReactNode {
  const workspace = workspaceForPath(path);
  const workspacePermission = `workspace.${workspace}`;
  if (!permissions.includes(workspacePermission)) {
    return routePage("Restricted workspace", workspacePermission, permissions, null);
  }
  switch (path) {
    case "/me/inbox": return routePage("Workflow inbox", "p01.workflow.read", permissions, <WorkflowWorkspace client={client} />);
    case "/me/employees": return routePage("Employees", "ps01.employee.read", permissions, <><EmployeeProfile client={client} /><PrivacyConsole client={client} /><EmployeeContactsPanel client={client} /><EmployeeDependentsPanel client={client} /></>);
    case "/me/personal-details": return routePage("Personal Details", "ps02.change.read", permissions, <><PersonalDetailsWorkspace client={client} /><ChangeRequestEditor client={client} onCreated={bump} /><ChangeRequestApproverQueue client={client} refreshToken={refresh} onDecided={bump} /></>);
    case "/me/attendance-leave": return routePage("Attendance & Leave", "ps03.leave.read", permissions, <><LeaveWorkspace client={client} /><SelfServiceSummary client={client} /></>);
    case "/me/service-register": return routePage("Service Register", "ps12.sr.read", permissions, <ServiceRegisterTimeline client={client} />);
    case "/me/documents": return routePage("Documents", "ps13.document.read", permissions, <><DocumentVaultView client={client} /><DataSubjectRequestConsole client={client} /></>);
    case "/team/transfers": return routePage("Transfers", "ps05.transfer.read", permissions, <><TransferWorkspace client={client} /><CounsellingConsole client={client} /></>);
    case "/team/promotions": return routePage("Promotions", "ps06.promotion.read", permissions, <><PromotionWorkspace client={client} /><DpcConvenePanel client={client} /><SealedCoverReview client={client} /></>);
    case "/team/training": return routePage("Training", "ps07.training.read", permissions, <><TrainingWorkspace client={client} /><TrainingNominationForm client={client} /></>);
    case "/team/apar": return routePage("APAR", "ps08.apar.read", permissions, <><AparWorkspace client={client} /><AparTierForms client={client} permissions={permissions} /></>);
    case "/team/disciplinary": return routePage("Disciplinary", "ps09.case.read", permissions, <><DisciplinaryWorkspace client={client} /><DisciplinaryCaseWorkbench client={client} /><EvidenceVaultList client={client} /></>);
    case "/admin/leave-sr-relay": return routePage("Leave-SR Relay", "ps04.relay.read", permissions, <LeaveSrRelayWorkspace client={client} />);
    case "/admin/payroll": return routePage("Payroll", "ps10.payroll.read", permissions, <><PayrollWorkspace client={client} /><PayrollRunConsole client={client} permissions={permissions} /></>);
    case "/admin/pension-retirement": return routePage("Pension & Retirement", "ps11.pension.read", permissions, <><PensionWorkspace client={client} /><PensionCaseConsole client={client} permissions={permissions} /></>);
    case "/admin/analytics": return routePage("Analytics", "ps14.analytics.read", permissions, <><AnalyticsWorkspace client={client} /><EmbeddedBiDashboard client={client} /></>);
    case "/admin/workflow-config": return routePage("Workflow Config", "p01.workflow.config.review", permissions, <WorkflowConfigConsole />);
    // W1 — Org-Admin configuration registries (full-coverage parity: cfg-depts, cfg-grades,
    // cfg-assign, cfg-geo, cfg-entities, cfg-classification, cfg-custom).
    case "/admin/configuration": return routePage("Configuration", "cfg.registry.read", permissions, <ConfigRegistryWorkspace client={client} />);
    default:
      return <section className="not-found" aria-labelledby="route-heading"><h2 id="route-heading" tabIndex={-1}>Page not found</h2><p>The requested HRMS destination does not exist.</p><button type="button" onClick={() => navigate(defaultPath(permissions))}>Go to your workspace</button></section>;
  }
}
