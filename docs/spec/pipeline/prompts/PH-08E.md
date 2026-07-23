/goal
  objective: Implement the PS09 natural-justice chain the 2026-07-02 coverage audit found absent (75/96 items
    NOT_FOUND — the current slice is open→charge→inquiry report→penalty→SR only):
    (1) preliminary_inquiries (FR-PS09-002: ordered→in-progress→submitted with recommendation
        PROCEED_MAJOR/PROCEED_MINOR/DROP/ADMIN_ADVICE),
    (2) suspensions with subsistence-allowance bounds (FR-PS09-003: rate within template floor/ceiling,
        default 25/75 → ERR-PS09-SUBSISTENCE-OUT-OF-BOUNDS; non-employment certificate gate
        ERR-PS09-NON-EMPLOYMENT-CERT-REQUIRED),
    (3) show_cause_notices with the DI-4 proposed-penalty subset rule: a finalised order's penalties must be a
        subset of proposed_penalty_json — otherwise ERR-PS09-PENALTY-EXCEEDS-PROPOSED,
    (4) authority_competence matrix (FR-PS09-018/DI-13) incl. the Art. 311(1) guard: for
        DISMISSAL/REMOVAL/COMPULSORY_RETIREMENT the passing authority must NOT be subordinate to the appointing
        authority — DISMISSAL finalised by a subordinate authority MUST throw ERR-PS09-AUTHORITY-NOT-COMPETENT
        (a negative test for exactly this is mandatory),
    (5) consultation gate (FR-PS09-019/DI-14): finalise blocked until every mandatory case_consultations row
        (UPSC/CVC/ICC/LEGAL) is CLOSED or WAIVED — otherwise ERR-PS09-CONSULTATION-PENDING,
    (6) disagreement_memos when the DA differs from the inquiry report (tentative_disagreement, served,
        responded before finalise),
    (7) case_timeline_events as a per-case hash chain (DI-21: seq_no, prev_hash, row_hash) with a verify
        operation that detects tampering → ERR-PS09-AUDIT-CHAIN-BROKEN,
    (8) abatement on death (FR-PS09-028/DI-26): respondent/case moves to ABATED; penalty finalise on an abated
        respondent throws ERR-PS09-CASE-ABATED.
  context:
    - docs/reviews/brd-coverage-audit-20260702.md
    - docs/brd/v3/PS09-disciplinary-cases-punishment.md   # E3/E4/E14/E19/E23/E24, DI-4/13/14/16/21/26, ERR-PS09-* catalogue
    - docs/data-model/09-PS09-disciplinary-punishment.sql
    - apps/api/src/modules/ps09/disciplinaryService.ts , apps/api/src/routes/ps09.routes.ts
    - apps/api/src/platform/  + the PH-08A persistence layer
  constraints:
    - Persist all new entities via the PH-08A persistence layer honouring the DDL shapes; parameterised queries
      only if SQL; order finalise (competence + consultation + subset + abatement gates, timeline append) is one
      transaction — a blocked gate leaves no partial order state.
    - Domain errors are THROWN with the BRD code as the error's `code` value: ERR-PS09-AUTHORITY-NOT-COMPETENT,
      ERR-PS09-CONSULTATION-PENDING, ERR-PS09-PENALTY-EXCEEDS-PROPOSED, ERR-PS09-SUBSISTENCE-OUT-OF-BOUNDS,
      ERR-PS09-CASE-ABATED, ERR-PS09-AUDIT-CHAIN-BROKEN. Tests assert error.code === "<CODE>";
      no details.marker indirection.
    - Maker≠checker SoD per BRD: DA, IO, PO and witnesses mutually distinct (ERR-PS09-ACTOR-CONFLICT where
      already modelled); the authority passing a penalty is never the respondent or the case initiator.
    - case_timeline_events is append-only; every state-changing action appends a chained row; the chain verify
      recomputes hashes, never trusts stored values.
    - No production console.log; no stack traces or internal paths in API error responses (natural-justice data
      is sensitive — no PII in logs).
    - Do NOT weaken oracles: no edits to docs/spec/pipeline/checks/**, docs/spec/pipeline/phases.yaml,
      .state/**, approvals/**, or other phases' prompt files.
  work_loops:
    - name: PI + suspension + show-cause
      max_iterations: 6
      repeat_until: preliminary_inquiries lifecycle persisted; suspensions enforce subsistence bounds and the
        NEC gate; show_cause_notices carry proposed_penalty_json and the DI-4 subset rule blocks
        finalise with ERR-PS09-PENALTY-EXCEEDS-PROPOSED.
      steps: [preliminary_inquiries, suspensions + subsistence bounds + NEC, show_cause_notices + subset gate]
    - name: competence + consultation + disagreement + chain + abatement
      max_iterations: 6
      repeat_until: authority_competence drives finalise with the Art. 311 not-subordinate guard;
        case_consultations gate finalise; disagreement_memos recorded and served; case_timeline_events hash
        chain appends on every action with a verify operation; death moves respondent/case to ABATED and blocks
        further penalty finalise.
      steps: [authority_competence + Art-311 guard, case_consultations gate, disagreement_memos, timeline hash chain + verify, abatement]
    - name: verify
      max_iterations: 4
      repeat_until: apps/api/test/ph08e-ps09-due-process.test.cjs covers the PI→suspension→show-cause chain,
        subsistence bounds, and the mandatory negatives asserting error.code — DISMISSAL by a subordinate
        authority → ERR-PS09-AUTHORITY-NOT-COMPETENT, pending consultation → ERR-PS09-CONSULTATION-PENDING,
        penalty beyond proposed → ERR-PS09-PENALTY-EXCEEDS-PROPOSED, abated case → ERR-PS09-CASE-ABATED — plus a
        chain-verify test that tampers a timeline row and detects ERR-PS09-AUDIT-CHAIN-BROKEN;
        `npm run typecheck` + `npm test` pass; `bash docs/spec/pipeline/checks/ph-08e.sh` GREEN.
      steps: [write tests incl. Art-311 negative + tamper test, npm run typecheck, npm test, run ph-08e.sh, fix]
  evidence_required:
    - deepened apps/api/src/modules/ps09 + routes with the eight capability areas persisted
    - apps/api/test/ph08e-ps09-due-process.test.cjs with the named positives, the Art-311 negative, and the tamper test
    - `npm run typecheck` + `npm test` green; `bash docs/spec/pipeline/checks/ph-08e.sh` GREEN
  escalate_when:
    - The competence matrix rows for a cadre are genuinely underspecified after reading FR-PS09-018.
    - A required entity shape conflicts between BRD and DDL (amend via spec workflow, not code guess).
    - The oracle demands an assertion that contradicts the BRD (never edit the check to pass — escalate).
