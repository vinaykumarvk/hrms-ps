#!/usr/bin/env bash
# URF-09 oracle: the complete external oracle, run end to end. GREEN here is a precondition for
# the human release decision, never a substitute for it. gate: human in the manifest.
source "$(dirname "$0")/lib.sh"
echo "== URF-09 integration and release-evidence oracle =="

R=docs/release/ui-remediation-followup-readiness.md
F=docs/evidence/ui-remediation-followup/urf-09-final-log.md

need_file "$R" 800
need_file "$F" 800

run npm run check
run npm run web:check
run npm run web:test:e2e
run npm audit --audit-level=low
run bash docs/spec/pipeline/checks/ph-05e.sh
run bash docs/spec/ui-remediation-pipeline/checks/uir-08.sh
run bash ops/security-headers-verification.sh

echo "-- production artifact negative scan --"
run npm run web:build
absentF "no demo password in released bundle" "Welcome@123" dist/apps/web
absentF "no demo employee id in released bundle" "PS-100246" dist/apps/web
absent  "no unsigned-token minting in released bundle" "alg[\"':[:space:]]+none" dist/apps/web

# the packet must name the four release blockers by id and state each one's status
if [ -f "$R" ]; then
  for f in FR-01 FR-02 FR-04 FR-10; do
    hasF "readiness packet addresses $f" "$f" "$R"
  done
  has "verdict stated" "verdict" "$R"
fi

no_placeholders "$R" "$F"
finish
