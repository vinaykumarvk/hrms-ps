#!/usr/bin/env bash
# URF-00 oracle: the baseline matrix exists, covers all 17 findings, and is backed by executed
# command output. It deliberately does NOT require those commands to be green — a red baseline
# is a finding, which is this phase's product.
source "$(dirname "$0")/lib.sh"
echo "== URF-00 baseline re-verification oracle =="

M=docs/spec/ui-remediation-followup/finding-state-matrix.yaml
L=docs/evidence/ui-remediation-followup/urf-00-command-log.md
S=docs/spec/ui-remediation-followup/scope-delta.md

need_file "$M" 600
need_file "$L" 600
need_file "$S" 200

if [ -f "$M" ]; then
  missing=""
  for n in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17; do
    grep -Eq "id:[[:space:]]*FR-$n\b" "$M" || missing="$missing FR-$n"
  done
  [ -z "$missing" ] && grn "all 17 findings present" || red "matrix missing:$missing"

  for k in current_anchor state evidence_id; do
    c=$(cnt "^[[:space:]]*$k:" "$M")
    [ "${c:-0}" -ge 17 ] && grn "$k present on all findings ($c)" || red "$k present on only ${c:-0}/17 findings"
  done

  has "states use the declared vocabulary" \
      "state:[[:space:]]*(resolved|partial|open|regressed|amendment_required)" "$M"
fi

if [ -f "$L" ]; then
  for c in "npm run check" "npm run web:check" "web:test:e2e" "npm audit" "ph-05e.sh" "uir-08.sh"; do
    hasF "logged: $c" "$c" "$L"
  done
  has "command results recorded" "^[[:space:]]*(result|exit code|status)[[:space:]]*:" "$L"
fi

has "deployment-surface delta recorded" "deployment surface|cloud run|server\.mjs" "$S"

no_placeholders "$M" "$L"

run npm run typecheck
finish
