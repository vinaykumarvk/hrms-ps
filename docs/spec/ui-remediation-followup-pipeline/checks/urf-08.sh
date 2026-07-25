#!/usr/bin/env bash
# URF-08 oracle: the ledger states its closures explicitly and every closure resolves to real
# executed evidence. The integrity check itself is authored by the phase; this oracle runs it
# and independently re-verifies the properties it must enforce.
source "$(dirname "$0")/lib.sh"
echo "== URF-08 evidence and traceability oracle =="

LEDGER=docs/spec/ui-remediation-followup/finding-closure-ledger.yaml
INTEG=docs/spec/ui-remediation-followup-pipeline/checks/ledger-integrity.sh

need_file "$LEDGER" 800
need_file "$INTEG" 200
need_file docs/evidence/ui-remediation-followup/final-command-log.md 600
need_file docs/evidence/ui-remediation-followup/accessibility-summary.md 300
need_file docs/evidence/ui-remediation-followup/keyboard-traversal.md 300
need_file docs/evidence/ui-remediation-followup/authorization-negative-results.md 300
need_file docs/release/ui-remediation-followup-readiness.md 600
need_dir_files docs/evidence/ui-remediation-followup/screenshot-matrix 3

run bash "$INTEG"

# independent re-verification of the property FR-09 turned on: closure must never be inherited
# from the shared YAML defaults anchor.
if [ -f "$LEDGER" ]; then
  fl=$(grep -n "^findings:" "$LEDGER" | head -1 | cut -d: -f1)
  cl=$(grep -n "closure_status:" "$LEDGER" | head -1 | cut -d: -f1)
  if [ -n "$fl" ] && [ -n "$cl" ] && [ "$cl" -lt "$fl" ]; then
    red "closure_status is set above findings: (in the shared defaults anchor) — this is the FR-09 defect"
  else
    grn "closure_status is not inherited from a defaults anchor"
  fi

  closed=$(cnt "closure_status:[[:space:]]*closed" "$LEDGER")
  evid=$(cnt "evidence_id:" "$LEDGER")
  [ "${evid:-0}" -ge "${closed:-0}" ] \
    && grn "evidence ids (${evid:-0}) cover closed findings (${closed:-0})" \
    || red "only ${evid:-0} evidence ids for ${closed:-0} closed findings"
fi

no_placeholders docs/evidence/ui-remediation-followup docs/release/ui-remediation-followup-readiness.md

# claim discipline: no compliance claim broader than what actually ran
absent "no unearned WCAG compliance claim" "wcag[- ]?(2\.[0-9][- ])?a{1,2}\b.{0,30}complian" \
       docs/evidence/ui-remediation-followup/accessibility-summary.md
finish
