/goal
  objective: Take PS07 training and PS08 APAR from the audited thin slices to BRD depth. Required by the
    2026-07-02 coverage audit (PS07: 104/118 NOT_FOUND; PS08: 16/22 FRs NOT_FOUND):
    PS07 — (1) skills/competencies taxonomy (skill_categories, skills, competencies) + role competency models
    (competency_models) + employee skill inventory (employee_skills) + gap analysis (skill_gap_analyses,
    skill_gap_items), (2) the versioned read-only Gap Contract (FR-PS07-024) published from the gap analysis and
    exposed via a gap-contract route for PS06/PS08 consumption, (3) certification validity/renewal with the
    lapsed_mandatory flip when a mandatory cert expires un-renewed (JOB-PS07-CERTEXPIRY semantics as an
    invokable job function), (4) campaign engine basics: training_campaigns + campaign_targets with wave
    assignment and escalation_level.
    PS08 — (5) appraisal_cycles + appraisal_templates + rating_scales as real persisted masters, (6) goals with
    weightage-sum validation (VAL-WEIGHTAGE/WSUM: performance goals sum to 100 ±0.01 at lock, DEVELOPMENT
    excluded) throwing ERR-PS08-WEIGHTAGE, (7) disclosure to the employee + representation window
    (representation_window_days; elapsed window throws ERR-PS08-REPWINDOW), (8) multi-RO part-period appraisal
    (appraisal_report_periods with supervision_months; below min_supervision_months yields No-Report, aggregate
    grade is supervision-weighted), (9) SLA escalation transferring authoring rights (is_escalated_author).
  context:
    - docs/reviews/brd-coverage-audit-20260702.md
    - docs/brd/v3/PS07-training-skill-development.md      # taxonomy entities, FR-PS07-024 Gap Contract, lapsed_mandatory, campaigns
    - docs/brd/v3/PS08-performance-appraisal-management.md    # E1-E19 entities, VAL-WEIGHTAGE/WSUM, ERR-PS08-* catalogue
    - docs/data-model/07-PS07-training-skill-development.sql , docs/data-model/08-PS08-performance-appraisal.sql
    - apps/api/src/modules/ps07/trainingService.ts , apps/api/src/modules/ps08/aparService.ts
    - apps/api/src/routes/ps07.routes.ts , apps/api/src/routes/ps08.routes.ts
    - apps/api/src/platform/  + the PH-08A persistence layer
  constraints:
    - Persist all new entities via the PH-08A persistence layer honouring the DDL shapes; parameterised queries
      only if SQL; goal lock, disclosure dispatch, and part-period aggregation are transactional.
    - Domain errors are THROWN with the BRD code as the error's `code` value: ERR-PS08-WEIGHTAGE,
      ERR-PS08-REPWINDOW (and other ERR-PS08-*/ERR-PS07-* where the implemented path needs them). Tests assert
      error.code === "<CODE>"; no details.marker indirection. The WSUM validation is named in code (VAL/WSUM
      identifier), not an anonymous inline sum.
    - The Gap Contract is versioned and read-only for consumers; PS06/PS08 read it through its contract, never
      through PS07 internals.
    - lapsed_mandatory is set by the cert-expiry job function from valid_until — evidence-backed, not manually
      settable by the employee.
    - Maker≠checker SoD where the BRD requires it: appraisee cannot author RO/RvO tiers (self-adjudication
      barred); escalated authoring is recorded via is_escalated_author.
    - No production console.log; no stack traces or internal paths in API error responses.
    - Do NOT weaken oracles: no edits to docs/spec/pipeline/checks/**, docs/spec/pipeline/phases.yaml,
      .state/**, approvals/**, or other phases' prompt files.
  work_loops:
    - name: PS07 taxonomy + gap contract + certs + campaigns
      max_iterations: 6
      repeat_until: taxonomy/model/inventory entities persisted; gap analysis produces skill_gap_items; the
        versioned Gap Contract is served by a gap-contract route; cert expiry flips lapsed_mandatory;
        training_campaigns assign campaign_targets with waves and escalation_level.
      steps: [taxonomy + models + inventory, gap analysis + gap-contract route, cert validity + lapsed_mandatory job, campaign engine]
    - name: PS08 cycles + goals + disclosure + multi-RO + SLA
      max_iterations: 6
      repeat_until: appraisal_cycles/templates/rating_scales persisted; goal lock enforces WSUM with
        ERR-PS08-WEIGHTAGE; disclosure + representation window enforced with ERR-PS08-REPWINDOW; multi-RO
        part-periods aggregate supervision-weighted with No-Report below threshold; SLA escalation transfers
        authoring and marks is_escalated_author.
      steps: [cycle/template/scale masters, goals + WSUM lock, disclosure + representation window, appraisal_report_periods + aggregate, SLA escalation]
    - name: verify
      max_iterations: 4
      repeat_until: apps/api/test/ph08d-ps07-ps08-depth.test.cjs covers gap-contract publication/consumption,
        lapsed_mandatory flip, campaign wave/escalation, multi-RO part-period aggregation, and negative
        assert.throws for ERR-PS08-WEIGHTAGE (weightage ≠ 100 at lock) and ERR-PS08-REPWINDOW asserting
        error.code; `npm run typecheck` + `npm test` pass; `bash docs/spec/pipeline/checks/ph-08d.sh` GREEN.
      steps: [write tests, npm run typecheck, npm test, run ph-08d.sh, fix]
  evidence_required:
    - deepened apps/api/src/modules/ps07 + ps08 + routes with persisted entities and the gap-contract route
    - apps/api/test/ph08d-ps07-ps08-depth.test.cjs with the named positive and negative tests
    - `npm run typecheck` + `npm test` green; `bash docs/spec/pipeline/checks/ph-08d.sh` GREEN
  escalate_when:
    - Gap Contract shape or representation-window clock start is genuinely ambiguous after reading the BRDs.
    - A required entity shape conflicts between BRD and DDL (amend via spec workflow, not code guess).
    - The oracle demands an assertion that contradicts the BRD (never edit the check to pass — escalate).
