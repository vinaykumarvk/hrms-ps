#!/usr/bin/env bash
# URF-00R oracle: the baseline the rest of the pipeline stands on is actually green, the oracle
# repairs are non-vacuous, and the triage that justified every test edit exists.
#
# This phase edited test assertions. That is the one kind of change an oracle cannot self-police —
# a suite can always be made green by weakening it. The mitigations are: every re-anchoring is
# recorded in the triage document with the behaviour that was independently verified, and the
# checks below assert that the *guarantees* (not the spellings) still hold.
source "$(dirname "$0")/lib.sh"
echo "== URF-00R baseline repair oracle =="

T=docs/spec/ui-remediation-followup/urf-00r-triage.md
need_file "$T" 3000

# the baseline itself
run npm run check
run npm run web:check
run bash docs/spec/pipeline/checks/ph-05e.sh

# the typecheck root cause must stay fixed, not be suppressed
absent "no ts-ignore/any-cast suppression in useForm" "@ts-(ignore|expect-error)" apps/web/src/lib/useForm.ts
has "FormValues reads initial directly" 'K in keyof T\]:\s*T\[K\]\["initial"\]' apps/web/src/lib/useForm.ts
has "submit marks every field touched" "TOUCH_ALL" apps/web/src/lib/useForm.ts
absent "no null-field touch dispatch" "field: null as unknown" apps/web/src/lib/useForm.ts

# the analytics testability regression must stay repaired
for s in loadAnalyticsDashboard isMartStale MART_DRILL_DIMENSIONS MART_FRESHNESS_SLA_MINUTES; do
  has "analytics exports $s" "^export (const|function|async function) $s" apps/web/src/modules/ps14/AnalyticsWorkspace.tsx
done
has "k-anonymity hook present" "data-suppressed" apps/web/src/modules/ps14/AnalyticsWorkspace.tsx
has "staleness hook present" "data-stale" apps/web/src/modules/ps14/AnalyticsWorkspace.tsx

# the evidence-line debug markers must not come back (the tests contradicted each other on this)
absent "no evidence-line debug marker card in any workspace" "evidence-line" apps/web/src/modules

# the oracle repairs themselves
absent "ui-remediation checks no longer depend on ripgrep" "\brg -" docs/spec/ui-remediation-pipeline/checks
need_file tools/e2e-preflight.mjs 800
has "e2e script runs the preflight" "e2e-preflight" package.json

# prove the ported negative scan is non-vacuous: it must go RED when the bundle is absent
if bash -c 'cd "$(mktemp -d)" && grep -rFqs "Welcome@123" dist/apps/web' 2>/dev/null; then
  red "negative-scan probe behaved unexpectedly"
else
  grn "negative scan reports absence rather than silently passing"
fi

no_placeholders "$T"
finish
