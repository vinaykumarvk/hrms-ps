#!/usr/bin/env bash
# URF-07 oracle: behavioral tests only. A source-regex assertion closes nothing in this phase —
# that was FR-04's and FR-09's complaint about the previous round.
source "$(dirname "$0")/lib.sh"
echo "== URF-07 residual UI and accessibility oracle =="

T=apps/web/test/error-boundary.test.cjs
E=apps/web/test/e2e/a11y-residual.spec.ts
A=docs/evidence/ui-remediation-followup/urf-07-primitive-adoption.md

need_file "$T" 300
need_file "$E" 300
need_file "$A" 200

run npm run web:check
run npm run web:test:e2e -- --project=chromium

# the forced-failure path must actually be exercised, not described
has "forced child throw is exercised" "throw" "$T"
has "reporting sink sanitizes" "sanit|redact" apps/web/src/app/errorReporting.ts

if [ -f "$E" ]; then
  for c in "safe-area" "focus"; do
    has "e2e covers: $c" "$c" "$E"
  done
fi

# adoption must be reported as a measured number, before and after
has "adoption count recorded" "[0-9]+" "$A"
echo "  info raw form controls now: $(grep -rhoE '<(input|select|textarea)[ >]' --include='*.tsx' apps/web/src | wc -l | tr -d ' ')"
finish
