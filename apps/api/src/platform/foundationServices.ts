import { JobService } from "../jobs/jobService";
import { MigrationStagingService } from "../migration/staging/migrationStagingService";
import { EmployeeMasterService } from "../modules/ps01/employeeMasterService";
import { NomineeService } from "../modules/ps01/nomineeService";
import { EmergencyContactService } from "../modules/ps01/emergencyContactService";
import { EducationService } from "../modules/ps01/educationService";
import { BankAccountService } from "../modules/ps01/bankAccountService";
import { InMemoryEmployeeProfileRepository } from "../modules/ps01/employeeProfileRepository";
import { EmployeeIdentityOpsService } from "../modules/ps01/identityOpsService";
import { InMemoryEmployeeIdentityOpsRepository } from "../modules/ps01/identityOpsRepository";
import { PersonalDetailsService } from "../modules/ps02/personalDetailsService";
import { InMemoryPersonalDetailsRepository, defaultPS02WorkflowConfig } from "../modules/ps02/personalDetailsRepository";
import { ChangeGovernanceService } from "../modules/ps02/changeGovernanceService";
import { InMemoryChangeGovernanceRepository } from "../modules/ps02/changeGovernanceRepository";
import { LeaveService } from "../modules/ps03/leaveService";
import { InMemoryLeaveRepository } from "../modules/ps03/leaveRepository";
import { AttendanceOpsService } from "../modules/ps03/attendanceOpsService";
import { LeaveYearCloseService, InMemoryLeaveYearCloseRepository } from "../modules/ps03/leaveYearCloseService";
import { ChangeEsignStepUpService, InMemoryChangeEsignStepUpRepository } from "../modules/ps02/changeEsignStepUpService";
import { VigilanceRegisterService, InMemoryVigilanceRegisterRepository } from "../modules/ps09/vigilanceRegisterService";
import { AadhaarVaultService, InMemoryAadhaarVaultRepository } from "../modules/ps01/aadhaarVaultService";
import { AttendanceExceptionService, InMemoryAttendanceExceptionRepository } from "../modules/ps03/attendanceExceptionService";
import { JoiningSequenceService, InMemoryJoiningSequenceRepository } from "../modules/ps05/joiningSequenceService";
import { LeaveBlackoutMassService, InMemoryLeaveBlackoutMassRepository } from "../modules/ps03/leaveBlackoutMassService";
import { ContinuousFeedbackService, InMemoryContinuousFeedbackRepository } from "../modules/ps08/continuousFeedbackService";
import { CareerSuccessionService, InMemoryCareerSuccessionRepository } from "../modules/ps06/careerSuccessionService";
import { VendorEmpanelmentService, InMemoryVendorEmpanelmentRepository } from "../modules/ps07/vendorEmpanelmentService";
import { CertifiedCopyService, InMemoryCertifiedCopyRepository } from "../modules/ps13/certifiedCopyService";
import { ChangeRequestTemplateService, InMemoryChangeRequestTemplateRepository } from "../modules/ps02/changeRequestTemplateService";
import { LmsIntegrationService, InMemoryLmsIntegrationRepository } from "../modules/ps07/lmsIntegrationService";
import { Feedback360Service, InMemoryFeedback360Repository } from "../modules/ps08/feedback360Service";
import { JurisdictionRetireeService, InMemoryJurisdictionRetireeRepository } from "../modules/ps09/jurisdictionRetireeService";
import { DigitalSignatureService, InMemoryDigitalSignatureRepository } from "../modules/ps08/digitalSignatureService";
import { OcrSearchService, InMemoryOcrSearchRepository } from "../modules/ps13/ocrSearchService";
import { NlQueryService, InMemoryNlQueryRepository } from "../modules/ps14/nlQueryService";
import { OutboundIntegrationService, InMemoryOutboundIntegrationRepository, OutboundTransport } from "../modules/ps04/outboundIntegrationService";
import { DigitalDeliveryService, InMemoryDigitalDeliveryRepository } from "../modules/ps11/digitalDeliveryService";
import { PhoneticSearchService, InMemoryPhoneticSearchRepository } from "../modules/ps01/phoneticSearchService";
import { DeathRecoveryService, InMemoryDeathRecoveryRepository } from "../modules/ps11/deathRecoveryService";
import { CorrectionCascadeService, InMemoryCorrectionCascadeRepository } from "../modules/ps06/correctionCascadeService";
import { OfflineVerificationService, InMemoryOfflineVerificationRepository } from "../modules/ps12/offlineVerificationService";
import { GlErpPostingService, InMemoryGlErpPostingRepository } from "../modules/ps10/glErpPostingService";
import { TimestampAuthorityService, LocalTimestampAuthority } from "../modules/ps12/timestampAuthorityService";
import { PredictiveAnalyticsService, InMemoryPredictiveAnalyticsRepository } from "../modules/ps14/predictiveAnalyticsService";
import { RetroImpactService, InMemoryRetroImpactRepository } from "../modules/ps02/retroImpactService";
import { PunchAnomalyService, InMemoryPunchAnomalyRepository } from "../modules/ps03/punchAnomalyService";
import { InMemoryAttendanceOpsRepository } from "../modules/ps03/attendanceOpsRepository";
import { LeaveSrRelayService } from "../modules/ps04/leaveSrRelayService";
import { InMemoryLeaveSrRelayRepository } from "../modules/ps04/leaveSrRelayRepository";
import { LeaveSrCatalogService } from "../modules/ps04/leaveSrCatalogService";
import { InMemoryLeaveSrCatalogRepository } from "../modules/ps04/leaveSrCatalogRepository";
import { TransferService } from "../modules/ps05/transferService";
import { InMemoryTransferRepository } from "../modules/ps05/transferRepository";
import { TransferCounsellingService } from "../modules/ps05/counsellingVacancyService";
import { InMemoryCounsellingVacancyRepository } from "../modules/ps05/counsellingVacancyRepository";
import { PromotionService } from "../modules/ps06/promotionService";
import { SealedCoverService } from "../modules/ps06/sealedCoverService";
import { InMemoryEstablishmentQslRepository } from "../modules/ps06/establishmentQslRepository";
import { InMemoryPromotionDepthRepository } from "../modules/ps06/promotionDepthRepository";
import { TrainingService } from "../modules/ps07/trainingService";
import { InMemoryTrainingDepthRepository } from "../modules/ps07/trainingDepthRepository";
import { AparService } from "../modules/ps08/aparService";
import { InMemoryAparDepthRepository } from "../modules/ps08/aparDepthRepository";
import { DisciplinaryService } from "../modules/ps09/disciplinaryService";
import { PS09DueProcessRepository, InMemoryPS09DueProcessRepository, defaultPS09CompetenceMatrix } from "../modules/ps09/dueProcessRepository";
import { PayrollService } from "../modules/ps10/payrollService";
import { PayrollEngineService } from "../modules/ps10/payrollEngineService";
import { InMemoryPayrollEngineRepository } from "../modules/ps10/payrollEngineRepository";
import { PayRuleService } from "../modules/ps10/payRuleService";
import { InMemoryPayRuleRepository } from "../modules/ps10/payRuleRepository";
import { CompensationIntegrationService } from "../modules/ps10/compensationIntegrationService";
import { InMemoryCompensationIntegrationRepository } from "../modules/ps10/compensationIntegrationRepository";
import { TaxEngineService } from "../modules/ps10/taxEngineService";
import { InMemoryTaxEngineRepository } from "../modules/ps10/taxEngineRepository";
import { LoanPerquisiteGlService, InMemoryLoanPerquisiteGlRepository } from "../modules/ps10/loanPerquisiteGlService";
import { PensionTreasuryService, InMemoryPensionTreasuryRepository } from "../modules/ps11/pensionTreasuryService";
import { PensionService } from "../modules/ps11/pensionService";
import { PensionDisbursementService } from "../modules/ps11/pensionDisbursementService";
import { InMemoryPensionDisbursementRepository } from "../modules/ps11/pensionDisbursementRepository";
import { PensionRuleService } from "../modules/ps11/pensionRuleService";
import { InMemoryPensionRuleRepository } from "../modules/ps11/pensionRuleRepository";
import { PensionBenefitService } from "../modules/ps11/pensionBenefitService";
import { InMemoryPensionBenefitRepository } from "../modules/ps11/pensionBenefitRepository";
import { PensionerLifecycleService } from "../modules/ps11/pensionerLifecycleService";
import { InMemoryPensionerLifecycleRepository } from "../modules/ps11/pensionerLifecycleRepository";
import { PensionRevisionService } from "../modules/ps11/pensionRevisionService";
import { InMemoryPensionRevisionRepository } from "../modules/ps11/pensionRevisionRepository";
import { ServiceRegisterService } from "../modules/ps12/serviceRegisterService";
import { SrIntegrityService, TimestampAuthority } from "../modules/ps12/srIntegrityService";
import { InMemorySrIntegrityRepository } from "../modules/ps12/srIntegrityRepository";
import { SrAdmissibilityService } from "../modules/ps12/srAdmissibilityService";
import { InMemorySrAdmissibilityRepository } from "../modules/ps12/srAdmissibilityRepository";
import { DocumentVaultService, ScanProvider, StubScanProvider } from "../modules/ps13/documentVaultService";
import { InMemoryDocumentSecurityRepository } from "../modules/ps13/documentSecurityRepository";
import { KeyProvider, LocalMasterKeyProvider } from "../modules/ps13/keyProvider";
import { AnalyticsService } from "../modules/ps14/analyticsService";
import { AnalyticsEngineService } from "../modules/ps14/analyticsEngineService";
import { InMemoryAnalyticsEngineRepository } from "../modules/ps14/analyticsEngineRepository";
import { NotificationService } from "../notifications/notificationService";
import { OrgConfigService } from "../modules/cfg/orgConfigService";
import { ph03AuthorityFacts, ph03Documents, ph03Employees, ph03Ids, ph03LeaveTypes } from "../seed/ph03Seed";
import { AuditService } from "./audit/auditService";
import { AuthorityResolutionService } from "./authority-resolution/authorityResolutionService";
import { AuthorizationService } from "./authorization/authorizationService";
import { HrmsWorkflowService } from "./workflow/hrmsWorkflowService";

export interface FoundationServices {
  audit: AuditService;
  authorization: AuthorizationService;
  authorityResolution: AuthorityResolutionService;
  employeeMaster: EmployeeMasterService;
  nominee: NomineeService;
  emergencyContact: EmergencyContactService;
  education: EducationService;
  bankAccount: BankAccountService;
  employeeIdentityOps: EmployeeIdentityOpsService;
  personalDetails: PersonalDetailsService;
  changeGovernance: ChangeGovernanceService;
  leave: LeaveService;
  attendanceOps: AttendanceOpsService;
  leaveYearClose: LeaveYearCloseService;
  changeEsignStepUp: ChangeEsignStepUpService;
  vigilanceRegister: VigilanceRegisterService;
  aadhaarVault: AadhaarVaultService;
  attendanceException: AttendanceExceptionService;
  joiningSequence: JoiningSequenceService;
  leaveBlackoutMass: LeaveBlackoutMassService;
  continuousFeedback: ContinuousFeedbackService;
  careerSuccession: CareerSuccessionService;
  vendorEmpanelment: VendorEmpanelmentService;
  certifiedCopy: CertifiedCopyService;
  changeRequestTemplate: ChangeRequestTemplateService;
  lmsIntegration: LmsIntegrationService;
  feedback360: Feedback360Service;
  jurisdictionRetiree: JurisdictionRetireeService;
  digitalSignature: DigitalSignatureService;
  ocrSearch: OcrSearchService;
  nlQuery: NlQueryService;
  outboundIntegration: OutboundIntegrationService;
  digitalDelivery: DigitalDeliveryService;
  phoneticSearch: PhoneticSearchService;
  deathRecovery: DeathRecoveryService;
  correctionCascade: CorrectionCascadeService;
  offlineVerification: OfflineVerificationService;
  glErpPosting: GlErpPostingService;
  timestampAuthority: TimestampAuthorityService;
  predictiveAnalytics: PredictiveAnalyticsService;
  retroImpact: RetroImpactService;
  punchAnomaly: PunchAnomalyService;
  leaveSrRelay: LeaveSrRelayService;
  leaveSrCatalog: LeaveSrCatalogService;
  transfer: TransferService;
  transferCounselling: TransferCounsellingService;
  promotion: PromotionService;
  sealedCover: SealedCoverService;
  training: TrainingService;
  /** W1 — Org-Admin configuration registries (full-coverage parity). */
  orgConfig: OrgConfigService;
  apar: AparService;
  disciplinary: DisciplinaryService;
  payroll: PayrollService;
  payrollEngine: PayrollEngineService;
  payRules: PayRuleService;
  compensationIntegration: CompensationIntegrationService;
  taxEngine: TaxEngineService;
  loanPerquisiteGl: LoanPerquisiteGlService;
  pensionTreasury: PensionTreasuryService;
  pension: PensionService;
  pensionDisbursement: PensionDisbursementService;
  pensionRules: PensionRuleService;
  pensionBenefits: PensionBenefitService;
  pensionerLifecycle: PensionerLifecycleService;
  pensionRevisions: PensionRevisionService;
  serviceRegister: ServiceRegisterService;
  srIntegrity: SrIntegrityService;
  srAdmissibility: SrAdmissibilityService;
  documentVault: DocumentVaultService;
  analytics: AnalyticsService;
  analyticsEngine: AnalyticsEngineService;
  workflow: HrmsWorkflowService;
  jobs: JobService;
  notifications: NotificationService;
  migrationStaging: MigrationStagingService;
}

export interface FoundationServicesOptions {
  /** PS04 relay HMAC key override (config injection for tests); production must set PS04_RELAY_HMAC_KEY. */
  ps04RelayHmacKey?: string;
  /** PH-08E: PS09 due-process repository override (e.g. the file-backed impl for DI-21 tamper checks). */
  ps09DueProcessRepository?: PS09DueProcessRepository;
  /** PH-10B: RFC 3161 TSA override for PS12 anchoring/attestation (a fake in tests; a licensed-CA client in production). */
  ps12TimestampAuthority?: TimestampAuthority;
  /** PH-10C: DI-11 malware-scan seam override for the PS13 vault (a deterministic fake in tests; a real engine in production). */
  ps13ScanProvider?: ScanProvider;
  /**
   * PH-15E: FR-PS13-005 envelope-encryption key seam override. Defaults to the local
   * master-key implementation (key material from PS13_MASTER_KEY env/config — never hardcoded);
   * production binds a real KMS/HSM client behind the same KeyProvider interface.
   */
  ps13KeyProvider?: KeyProvider;
  /**
   * PH-16A: FR-EPM-015 AC5 configurable merge-undo window (default 7 days per the BRD).
   * Tests inject 0 to exercise the UNDO_EXPIRED fail-closed guard.
   */
  ps01MergeUndoWindowDays?: number;
  /**
   * PH-16C: FR-PS04-15 BR-15.1 lease_timeout override (default 120000 ms per the
   * integration_config seed in docs/data-model/04-*.sql). Tests inject 0 so an IN_FLIGHT
   * claim is immediately reapable.
   */
  ps04LeaseTimeoutMs?: number;
  /**
   * PH-16D: injectable clock for the PS05 counselling turn engine so JOB-PS05-COUNSEL-TIMEOUT
   * (AUTO_PASS_TIMEOUT after turn_timeout_seconds) is testable without busy-waiting.
   */
  ps05CounsellingClock?: () => Date;
  /**
   * PH-23A: injectable X.3 outbound transport for the PS04 outbound integration framework so the
   * circuit-breaker / retry / dead-letter paths are testable without a live external endpoint.
   */
  ps04OutboundTransport?: import("../modules/ps04/outboundIntegrationService").OutboundTransport;
}

/**
 * Resolve the PS04 relay HMAC key: explicit override, then the PS04_RELAY_HMAC_KEY
 * environment variable. Outside production a deterministic test-only value is injected
 * so suites can run without environment setup; production refuses to start without the env key.
 */
function resolvePS04RelayHmacKey(options: FoundationServicesOptions): string {
  const configured = options.ps04RelayHmacKey ?? process.env.PS04_RELAY_HMAC_KEY;
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("PS04_RELAY_HMAC_KEY must be set in production");
  }
  return "ps04-relay-local-test-key";
}

export function createFoundationServices(options: FoundationServicesOptions = {}): FoundationServices {
  const audit = new AuditService();
  const authorization = new AuthorizationService();
  const serviceRegister = new ServiceRegisterService(audit);
  const employeeProfileRepository = new InMemoryEmployeeProfileRepository();
  const employeeMaster = new EmployeeMasterService(ph03Employees(), authorization, audit, serviceRegister, employeeProfileRepository);
  // PH-62A: PS01 FR-EPM-004 nominee register (net-new; VAL-NOMINEE share invariant, soft-delete, row_version).
  const nominee = new NomineeService(employeeMaster, authorization, audit);
  // PH-63A: PS01 FR-EPM-005 emergency-contact register (net-new; unique-priority invariant, soft-delete).
  const emergencyContact = new EmergencyContactService(employeeMaster, authorization, audit);
  // PH-64A: PS01 FR-EPM-006 education register (net-new; single-highest invariant, soft-delete, row_version).
  const education = new EducationService(employeeMaster, authorization, audit);
  // PH-65A: PS01 FR-EPM-008 bank-account register (net-new; VAL-IFSC + single-salary + PENDING lifecycle + penny-drop).
  const bankAccount = new BankAccountService(employeeMaster, authorization, audit);
  // PH-16A: PS01 dedup/alias-merge (E19/E21), bulk import (E20a/E20b), and lifecycle
  // :separate/:reactivate/:archive behind the repository pattern (migration 0028). The alias
  // resolver makes every master read alias-transparent (FR-EPM-015 AC4 / FR-EPM-019 AC4).
  const employeeIdentityOps = new EmployeeIdentityOpsService(
    employeeMaster,
    authorization,
    audit,
    employeeProfileRepository,
    new InMemoryEmployeeIdentityOpsRepository(),
    { mergeUndoWindowDays: options.ps01MergeUndoWindowDays }
  );
  employeeMaster.setAliasResolver((scope, employeeId) => employeeIdentityOps.resolveEmployeeId(scope, employeeId).employeeId);
  // PH-10C: PS13 hardening entities (E15 scan_results, E21 security_clearances, E12 document_audit,
  // E8 retention classes, E18 disposition_records) behind the repository pattern; the DI-11 scan
  // seam is injectable (fake in tests; the stub is recorded integration debt, not a scanner).
  const documentVault = new DocumentVaultService(
    ph03Documents(),
    audit,
    // PH-15E: E19 content is envelope-encrypted behind the injectable KeyProvider seam —
    // per-object AES-256-GCM DEKs, only wrapped_dek + kms_key_id persisted (FR-PS13-005).
    new InMemoryDocumentSecurityRepository(options.ps13KeyProvider ?? new LocalMasterKeyProvider()),
    options.ps13ScanProvider ?? new StubScanProvider()
  );
  const authorityResolution = new AuthorityResolutionService(ph03AuthorityFacts());
  const notifications = new NotificationService();
  const workflow = new HrmsWorkflowService(authorityResolution, audit, notifications);
  const jobs = new JobService();
  // PH-07C: field sensitivity + approval routing come from the seeded config entities, never hardcoded.
  const personalDetailsRepository = new InMemoryPersonalDetailsRepository();
  const ps02Config = defaultPS02WorkflowConfig(ph03Ids.tenant);
  for (const entry of ps02Config.catalog) {
    personalDetailsRepository.saveSensitivityCatalogEntry(entry);
  }
  personalDetailsRepository.saveApprovalMatrix(ps02Config.matrix);
  const personalDetails = new PersonalDetailsService(employeeMaster, authorization, audit, workflow, documentVault, notifications, personalDetailsRepository);
  // PH-16B: FR-PS02-009 bulk_correction_batches (E12) + FR-PS02-019 cr_risk_signals (E13,
  // append-only) + FR-PS02-018 employment-status gating behind the repository pattern
  // (migration 0029). Field sensitivity and approval routing come from the PH-07C config
  // entities seeded above; detector windows are BR1 configuration with documented defaults.
  const changeGovernance = new ChangeGovernanceService(
    employeeMaster,
    authorization,
    audit,
    workflow,
    notifications,
    personalDetailsRepository,
    new InMemoryChangeGovernanceRepository()
  );
  // PH-16C: the catalog/lease/reaper/certificate service shares the relay repository — the
  // claim path pins pinned_mapping_version on, and the reaper recovers, the same outbox rows.
  const leaveSrRelayRepository = new InMemoryLeaveSrRelayRepository();
  const leaveSrRelay = new LeaveSrRelayService(authorization, audit, serviceRegister, notifications, leaveSrRelayRepository, {
    hmacKey: resolvePS04RelayHmacKey(options),
  });
  // PH-16C: FR-PS04-02 sr_event_mapping versioned catalog (DRAFT/PUBLISHED/RETIRED,
  // ERR-PS04-MAPPING-OVERLAP, VAL-PS04-CITATION), FR-PS04-15 relay_partition_lease +
  // JOB-PS04-REAPER, FR-PS04-18 prepension_certificate behind the repository pattern
  // (migration 0030). lease_timeout_ms is BR-15.1 configuration (integration_config seed).
  const leaveSrCatalog = new LeaveSrCatalogService(
    authorization,
    audit,
    jobs,
    leaveSrRelayRepository,
    new InMemoryLeaveSrCatalogRepository(),
    { leaseTimeoutMs: options.ps04LeaseTimeoutMs }
  );
  const leaveRepository = new InMemoryLeaveRepository();
  for (const leaveType of ph03LeaveTypes()) {
    leaveRepository.saveLeaveType(leaveType);
  }
  const leave = new LeaveService(employeeMaster, authorization, audit, workflow, leaveSrRelay, jobs, notifications, leaveRepository);
  // PH-15C: PS03 operational attendance core — E1 shifts / E2 rosters (VAL-PS03-SHIFT-TIMES,
  // VAL-PS03-ROSTER-OVERLAP with supersede-on-publish), the E6 attendance_punches append-only
  // ledger (dedup on (device_id, source_ref), DEVICE_NOT_AUTHORIZED fail-closed device auth,
  // INVALID_PUNCH_TIME, attendance_date via the shift's date_anchor_rule), and the E11
  // comp_off_ledger (FIFO redemption, COMP_OFF_INSUFFICIENT/COMP_OFF_EXPIRED,
  // JOB-PS03-COMPOFF-EXPIRE sweep) behind the repository pattern (migration 0024). Daily
  // attendance derivation stays with the PH-07D LeaveService (deriveAttendanceFromPunches wires in).
  const attendanceOps = new AttendanceOpsService(employeeMaster, authorization, audit, jobs, leave, new InMemoryAttendanceOpsRepository());
  const leaveYearClose = new LeaveYearCloseService(authorization, audit, new InMemoryLeaveYearCloseRepository());
  const changeEsignStepUp = new ChangeEsignStepUpService(authorization, audit, new InMemoryChangeEsignStepUpRepository());
  const vigilanceRegister = new VigilanceRegisterService(authorization, audit, new InMemoryVigilanceRegisterRepository());
  const aadhaarVault = new AadhaarVaultService(authorization, audit, new InMemoryAadhaarVaultRepository());
  const attendanceException = new AttendanceExceptionService(authorization, audit, new InMemoryAttendanceExceptionRepository());
  const joiningSequence = new JoiningSequenceService(authorization, audit, new InMemoryJoiningSequenceRepository());
  const leaveBlackoutMass = new LeaveBlackoutMassService(authorization, audit, new InMemoryLeaveBlackoutMassRepository());
  const continuousFeedback = new ContinuousFeedbackService(authorization, audit, new InMemoryContinuousFeedbackRepository());
  const careerSuccession = new CareerSuccessionService(authorization, audit, new InMemoryCareerSuccessionRepository());
  const vendorEmpanelment = new VendorEmpanelmentService(authorization, audit, new InMemoryVendorEmpanelmentRepository());
  const certifiedCopy = new CertifiedCopyService(authorization, audit, documentVault, new InMemoryCertifiedCopyRepository());
  const changeRequestTemplate = new ChangeRequestTemplateService(authorization, audit, new InMemoryChangeRequestTemplateRepository());
  const lmsIntegration = new LmsIntegrationService(authorization, audit, new InMemoryLmsIntegrationRepository());
  const feedback360 = new Feedback360Service(authorization, audit, new InMemoryFeedback360Repository());
  const jurisdictionRetiree = new JurisdictionRetireeService(authorization, audit, new InMemoryJurisdictionRetireeRepository());
  const digitalSignature = new DigitalSignatureService(authorization, audit, new InMemoryDigitalSignatureRepository());
  const ocrSearch = new OcrSearchService(authorization, audit, new InMemoryOcrSearchRepository());
  const nlQuery = new NlQueryService(authorization, audit, new InMemoryNlQueryRepository());
  const ps04Transport: OutboundTransport = options.ps04OutboundTransport ?? { send: () => ({ ok: true }) };
  const outboundIntegration = new OutboundIntegrationService(authorization, audit, ps04Transport, new InMemoryOutboundIntegrationRepository());
  const digitalDelivery = new DigitalDeliveryService(authorization, audit, new InMemoryDigitalDeliveryRepository());
  const phoneticSearch = new PhoneticSearchService(authorization, audit, new InMemoryPhoneticSearchRepository());
  const deathRecovery = new DeathRecoveryService(authorization, audit, new InMemoryDeathRecoveryRepository());
  const correctionCascade = new CorrectionCascadeService(authorization, audit, new InMemoryCorrectionCascadeRepository());
  const offlineVerification = new OfflineVerificationService(authorization, audit, new InMemoryOfflineVerificationRepository());
  const glErpPosting = new GlErpPostingService(authorization, audit, new InMemoryGlErpPostingRepository());
  const timestampAuthority = new TimestampAuthorityService(authorization, audit, new LocalTimestampAuthority());
  const predictiveAnalytics = new PredictiveAnalyticsService(authorization, audit, new InMemoryPredictiveAnalyticsRepository());
  const retroImpact = new RetroImpactService(authorization, audit, new InMemoryRetroImpactRepository());
  const punchAnomaly = new PunchAnomalyService(authorization, audit, new InMemoryPunchAnomalyRepository());
  const transfer = new TransferService(employeeMaster, authorization, audit, workflow, serviceRegister, documentVault, notifications, new InMemoryTransferRepository());
  // PH-08A: FR-015 establishment register + FR-016 qualifying-service ledger kernels behind the repository seam.
  // PH-08C: roster/refusal/probation/legal-case depth entities behind the same repository pattern.
  // PH-10D: shared with the PS14 engine as the MART_ESTABLISHMENT contracted read source.
  const establishmentQslRepository = new InMemoryEstablishmentQslRepository();
  const promotion = new PromotionService(
    employeeMaster,
    authorization,
    audit,
    workflow,
    serviceRegister,
    documentVault,
    notifications,
    establishmentQslRepository,
    new InMemoryPromotionDepthRepository()
  );
  // PH-35C: PS06 FR-008 sealed-cover register (backs the PH-34B sealed-cover review UI).
  const sealedCover = new SealedCoverService(authorization, audit);
  // PH-16D: PS05 FR-003/019 + BRD rules 5/6 — vacancy_positions/vacancy_reservations with the
  // strength READ-THROUGH from the PH-08A sanctioned-posts kernel above (PS05 never owns a
  // strength counter), ranked transfer_preferences, the interactive counselling turn engine
  // (current_turn_employee_id vacancy lock, append-only counselling_choices,
  // ERR-PS05-COUNSEL-TURN, AUTO_PASS_TIMEOUT via the injectable clock), and MUTUAL_TRANSFER
  // coupled pairing (ERR-PS05-MUTUAL-PAIR) behind the repository pattern (migration 0031).
  const transferCounselling = new TransferCounsellingService(
    employeeMaster,
    authorization,
    audit,
    serviceRegister,
    establishmentQslRepository,
    new InMemoryCounsellingVacancyRepository(),
    { clock: options.ps05CounsellingClock }
  );
  // PH-08D: PS07 taxonomy/gap-contract/campaign + PS08 cycle/goal/disclosure/part-period depth
  // entities behind the same repository pattern.
  const orgConfig = new OrgConfigService(authorization, audit);
  const training = new TrainingService(
    employeeMaster,
    authorization,
    audit,
    workflow,
    serviceRegister,
    documentVault,
    notifications,
    new InMemoryTrainingDepthRepository()
  );
  const apar = new AparService(
    employeeMaster,
    authorization,
    audit,
    workflow,
    serviceRegister,
    documentVault,
    notifications,
    new InMemoryAparDepthRepository()
  );
  // PH-08E: PS09 natural-justice chain entities (E3/E4/E14/E15/E23/E24 + DI-21 timeline chain)
  // behind the same repository pattern; the E23 competence matrix is seeded reference data.
  const ps09DueProcessRepository = options.ps09DueProcessRepository ?? new InMemoryPS09DueProcessRepository();
  for (const rule of defaultPS09CompetenceMatrix(ph03Ids.tenant)) {
    ps09DueProcessRepository.saveCompetenceRule(rule);
  }
  const disciplinary = new DisciplinaryService(employeeMaster, authorization, audit, workflow, serviceRegister, documentVault, notifications, ps09DueProcessRepository);
  const payroll = new PayrollService(employeeMaster, authorization, audit);
  // PH-09A: persisted, effective-dated rule substrate — PS10 pay_components/pay_rules/rate_tables
  // and PS11 pen_* rule tables E30-E36 behind the same repository pattern.
  const payRuleRepository = new InMemoryPayRuleRepository();
  const payRules = new PayRuleService(authorization, audit, payRuleRepository);
  // PH-09B: deterministic PS10 payroll engine at BRD depth — payroll_runs/payslips/payslip_lines/
  // arrears/deduction_carryforwards over the PH-09A rule substrate, with the PS03 payroll feed
  // consumed at snapshot time (FR-05) and post-lock supersede-versioning (FR-16).
  const payrollEngineRepository = new InMemoryPayrollEngineRepository();
  const payrollEngine = new PayrollEngineService(employeeMaster, authorization, audit, leave, payRuleRepository, payrollEngineRepository);
  // PH-09D: PS10 compensation integration — E21 bank_disbursements + E31 disbursement_holds
  // with the FR-15 tie-out equation (ERR-PS10-RECON-TIEOUT) and sign-off SoD
  // (ERR-PS10-RECON-UNSIGNED), FR-09 PS09 penalty-order recoveries bounded by floor + CPC s.60
  // cap (ERR-PS10-RECOVERY-BARRED), E30 fnf_settlements pulling loans_advances +
  // deduction_carryforwards, and FR-23 SR postings via the PS12 ingest contract (fact_key).
  const compensationIntegration = new CompensationIntegrationService(
    authorization,
    audit,
    payrollEngine,
    payrollEngineRepository,
    disciplinary,
    serviceRegister,
    new InMemoryCompensationIntegrationRepository()
  );
  // PH-15A: PS10 income-tax/TDS engine — E15 tax_declarations with the full persisted FR-07
  // pipeline (regime switch recomputes every stage + per-month TDS from the payslip_lines
  // ledger, cutoff lock -> ERR-PS10-SNAPSHOT-FROZEN) and E29 statutory_remittances
  // (ACCRUED -> DEPOSITED -> MATCHED) gating Form-16 Part A; Form-24Q reconciles quarterly
  // totals to the monthly TDS ledger (migration 0022). Slab/surcharge/cess/87A/std-deduction
  // values are effective-dated TAX_SLAB rate rows on the PH-09A substrate, never constants.
  const taxEngine = new TaxEngineService(employeeMaster, authorization, audit, payRuleRepository, payrollEngineRepository, new InMemoryTaxEngineRepository());
  const loanPerquisiteGl = new LoanPerquisiteGlService(employeeMaster, authorization, audit, new InMemoryLoanPerquisiteGlRepository());
  const pensionRules = new PensionRuleService(authorization, audit, new InMemoryPensionRuleRepository());
  // PH-09C: PS11 benefit records E07-E10/E41 behind the repository pattern (migration 0016);
  // the scheme-branched pension engine consumes the PH-09A rule substrate above and the
  // Rule 9 gate consumes the PS09 proceedings state.
  const pensionBenefitRepository = new InMemoryPensionBenefitRepository();
  const pension = new PensionService(employeeMaster, payroll, authorization, audit, serviceRegister, documentVault, pensionRules, pensionBenefitRepository);
  const pensionBenefits = new PensionBenefitService(authorization, audit, pension, pensionRules, payroll, disciplinary, pensionBenefitRepository);
  // PH-15B: PS11 FR-12 pensioner master & lifecycle (E14/E15/E26) + FR-13 revision engine
  // (E16) behind the repository pattern (migration 0023). The pen_pensioners row is created
  // ON PPO AUTHORISATION via the PensionService hook; a lapsed LC suspends the lifecycle to
  // SUSPENDED_NO_LC and holds disbursement (ERR-PS11-LC-SUSPENDED); death of a SELF pensioner
  // converts to family pension through the E26 hierarchy (CONVERTED_TO_FAMILY); DA /
  // pay-commission batches compute deterministic old/new/arrear deltas and are immutable
  // once applied (ERR-PS11-REVISION-IMMUTABLE).
  const pensionerLifecycleRepository = new InMemoryPensionerLifecycleRepository();
  const pensionerLifecycle = new PensionerLifecycleService(authorization, audit, pension, pensionBenefits, pensionerLifecycleRepository);
  pension.onPpoIssued((hookActor, issuedCase) => {
    pensionerLifecycle.enrolFromPpo(hookActor, issuedCase);
  });
  const pensionRevisions = new PensionRevisionService(
    authorization,
    audit,
    pensionRules,
    pensionerLifecycleRepository,
    new InMemoryPensionRevisionRepository((row) => pensionerLifecycleRepository.savePensioner(row))
  );
  // PH-09D: PS11 FR-14 pre-credit account verification gate (E42) — disbursement fails
  // closed without an ACTIVE PASSED verification (ERR-PS11-ACCOUNT-VERIFY, IR16); PH-15B
  // adds the FR-12 life-certificate suspension gate ahead of it.
  const pensionDisbursement = new PensionDisbursementService(authorization, audit, pension, new InMemoryPensionDisbursementRepository(), pensionerLifecycle);
  const pensionTreasury = new PensionTreasuryService(authorization, audit, new InMemoryPensionTreasuryRepository());
  // PH-10B: PS12 integrity pillars — verify + JOB-PS12-INTEGRITY, Merkle anchors behind the
  // injectable RFC 3161 TSA seam (JOB-PS12-ANCHOR), gap register (JOB-PS12-GAPSCAN),
  // attestations, and P02-redacted certified extracts — behind the repository pattern.
  const srIntegrity = new SrIntegrityService(authorization, audit, serviceRegister, jobs, new InMemorySrIntegrityRepository(), options.ps12TimestampAuthority);
  // PH-15D: PS12 admissibility + longevity — §65B/BSA authenticity certificates over the
  // verified chain (E24, GENERATE_65B), sr_subscriptions with the single authenticated pull
  // feed (E16, since_seq/last_delivered_seq, WEBHOOK/MESSAGE_BUS -> SR_DELIVERY_MODE_DEFERRED),
  // and sr_ltv_renewals re-anchoring over existing heads (E25) — behind the repository pattern.
  const srAdmissibility = new SrAdmissibilityService(audit, serviceRegister, srIntegrity, new InMemorySrAdmissibilityRepository(), options.ps12TimestampAuthority);
  const analytics = new AnalyticsService(employeeMaster, workflow, serviceRegister, documentVault, disciplinary, payroll, pension, authorization, audit);
  // PH-10D: the real PS14 analytics engine (migration 0021) — governed/versioned kpi_definitions,
  // append-only bitemporal kpi_snapshots (FR-23), JOB-PS14-MART-* refresh over the seeded
  // analytics_datamarts with datamart_refresh_logs (FR-03), k-anonymity suppression_policies
  // (FR-17, default k=5), and maker-checker analytics_scope_policies (FR-04) — behind the
  // repository pattern. The seeded substrate comes from the BRD, not invented per-domain.
  const analyticsEngine = new AnalyticsEngineService(authorization, audit, jobs, leave, apar, establishmentQslRepository, new InMemoryAnalyticsEngineRepository());
  analyticsEngine.seedTenantDefaults({ tenantId: ph03Ids.tenant, entityId: ph03Ids.entity });
  const migrationStaging = new MigrationStagingService(employeeMaster);
  return {
    audit,
    authorization,
    authorityResolution,
    employeeMaster,
    nominee,
    emergencyContact,
    education,
    bankAccount,
    employeeIdentityOps,
    personalDetails,
    changeGovernance,
    leave,
    attendanceOps,
    leaveYearClose,
    changeEsignStepUp,
    vigilanceRegister,
    aadhaarVault,
    attendanceException,
    joiningSequence,
    leaveBlackoutMass,
    continuousFeedback,
    careerSuccession,
    vendorEmpanelment,
    certifiedCopy,
    changeRequestTemplate,
    lmsIntegration,
    feedback360,
    jurisdictionRetiree,
    digitalSignature,
    ocrSearch,
    nlQuery,
    outboundIntegration,
    digitalDelivery,
    phoneticSearch,
    deathRecovery,
    correctionCascade,
    offlineVerification,
    glErpPosting,
    timestampAuthority,
    predictiveAnalytics,
    retroImpact,
    punchAnomaly,
    leaveSrRelay,
    leaveSrCatalog,
    transfer,
    transferCounselling,
    promotion,
    sealedCover,
    training,
    orgConfig,
    apar,
    disciplinary,
    payroll,
    payrollEngine,
    payRules,
    compensationIntegration,
    taxEngine,
    loanPerquisiteGl,
    pensionTreasury,
    pension,
    pensionDisbursement,
    pensionRules,
    pensionBenefits,
    pensionerLifecycle,
    pensionRevisions,
    serviceRegister,
    srIntegrity,
    srAdmissibility,
    documentVault,
    analytics,
    analyticsEngine,
    workflow,
    jobs,
    notifications,
    migrationStaging,
  };
}
