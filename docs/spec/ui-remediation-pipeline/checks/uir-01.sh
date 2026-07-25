#!/usr/bin/env bash
source "$(dirname "$0")/lib.sh"
echo "== UIR-01 baseline repair oracle =="
need_file apps/web/src/app/ErrorBoundary.tsx 300
need_file apps/web/test/ui-remediation-baseline.test.cjs 300
need_file docs/evidence/ui-remediation/baseline-command-log.md 300
# URF-00R: ported off `rg`. No ripgrep binary exists in the driver's environment, so the previous
# `rg ... && red || grn` forms silently took the "ok" branch on command-not-found.
grep -rEq --include='*.css' --include='*.tsx' '\b100vh\b' apps/web/src && red "100vh remains" || grn "no 100vh"
grep -rEq --include='*.css' 'prefers-reduced-motion' apps/web/src && grn "reduced motion" || red "missing reduced motion"
run npm run web:typecheck
run npm run web:build
run npm run web:test
run bash docs/spec/pipeline/checks/ph-05e.sh
finish
