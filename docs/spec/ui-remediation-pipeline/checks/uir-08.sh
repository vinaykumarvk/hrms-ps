#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"
echo "== UIR-08 integration release-evidence oracle =="
for f in docs/evidence/ui-remediation/final-command-log.md docs/evidence/ui-remediation/accessibility-summary.md docs/evidence/ui-remediation/keyboard-traversal.md docs/evidence/ui-remediation/authorization-negative-results.md docs/release/ui-remediation-readiness.md; do need_file "$f" 300; done
[ -d docs/evidence/ui-remediation/screenshot-matrix ] && [ "$(find docs/evidence/ui-remediation/screenshot-matrix -type f | wc -l)" -ge 3 ] && grn "screenshot matrix" || red "screenshot matrix incomplete"
run npm run check
run npm run web:check
run npm run web:test:e2e -- --project=chromium
run bash docs/spec/pipeline/checks/ph-05e.sh
run npm audit --audit-level=low
# URF-00R: the production-artifact negative scan is ported off ripgrep and made non-vacuous.
# It previously negated a ripgrep fixed-string search over dist/apps/web. No ripgrep binary
# exists in the driver's environment, so that command failed with 127, the negation turned the
# failure into success, and the scan reported PASS without reading a single file — while it was
# the sole evidence behind FR-01's closure. It now also fails when the scan target is missing:
# a negative assertion against a bundle that was never built proves nothing.
if [ ! -d dist/apps/web ]; then
  red "production negative scan — dist/apps/web absent, assertion would be vacuous (run npm run web:build)"
else
  grep -rFqs "Welcome@123" dist/apps/web && red "demo password present in production bundle" || grn "no demo password in bundle"
  grep -rFqs 'alg:"none"' dist/apps/web && red "unsigned-token minting present in production bundle" || grn "no alg:none in bundle"
fi
grep -Eq 'Blocking Gates Evaluated:[[:space:]]*16/16' docs/release/ui-remediation-readiness.md 2>/dev/null \
  && grn "16/16 blocking gates evaluated" || red "blocking gate evidence incomplete"
finish
