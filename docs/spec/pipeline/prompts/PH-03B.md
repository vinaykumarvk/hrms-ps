/goal
  objective: Implement the SYSTEMS OF RECORD services in apps/api — PS01 employee master (read-only lookup +
    governed changes), PS12 append-only SR ingestion (idempotency, semantic dedup, provenance, source-driven
    reversal), and PS13 document metadata/vault (legal-hold + retention hooks) — consuming the PH-03A platform layer.
  context:
    - docs/spec/phased-plan.yaml
    - docs/data-model/01-PS01*.sql , 12-PS12*.sql , 13-PS13*.sql   # the schemas these services own
    - docs/contracts/openapi/PS01.yaml , PS12.yaml , PS13.yaml , docs/contracts/error-taxonomy.yaml
    - apps/api/src/modules , apps/api/src/platform    # PH-03A platform layer to consume
  constraints:
    - PS12 SR ledger is APPEND-ONLY: idempotent ingest (dedup tuple + fact_key), semantic dedup, provenance,
      supersede-not-delete reversal. Never UPDATE/DELETE a ledger row.
    - PS13 legal-hold BLOCKS disposal; retention enforced. P02 field masking on serialization (PII ceiling).
    - Services expose contracts, not table internals. Unsafe writes are transactional + idempotent where required.
    - No console.log; no stack traces in errors; parameterised queries; RLS-respecting queries.
  work_loops:
    - name: PS01 + PS12 + PS13 services
      max_iterations: 8
      repeat_until: apps/api/src/modules/ps01/**, ps12/**, ps13/** implement the master lookup+governed-change,
        SR ingest (idempotent/dedup/append-only/reversal), and document metadata+storage (legal-hold/retention) APIs
        per the OpenAPI contracts, consuming PH-03A.
      steps: [implement PS01 read + governed change, PS12 sr_ingest, PS13 vault+hold/retention; wire P05 audit + P02 masking]
    - name: Verify
      max_iterations: 4
      repeat_until: unit tests (SR semantic-dedup; PS13 legal-hold blocks disposal; P02 field masking) exist and,
        with deps installed, pass; integration tests (PS01 identity event -> PS12 SR ingest; document attach by module
        reference) exist and pass; `npm run typecheck` passes. If the toolchain cannot install, structural + contract
        coverage pass and it is noted.
      steps: [write tests, npm install if needed, typecheck, run tests, fix]
  evidence_required:
    - apps/api/src/modules/ps01/** , ps12/** , ps13/**
    - unit: SR semantic-dedup, doc legal-hold blocks disposal, P02 masking; integration: PS01->PS12 SR, doc attach
    - docs/spec/manifest.json                    # record PH-03B verdict
  escalate_when:
    - PS12 append-only semantics cannot be guaranteed (quarantine SR writers per the plan).
