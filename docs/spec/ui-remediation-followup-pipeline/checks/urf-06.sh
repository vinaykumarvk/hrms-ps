#!/usr/bin/env bash
# URF-06 oracle: the shipped artifact is the evidence. The negative scan runs against the built
# bundle with the demo flag both unset and set — the flag-on case is the one the original
# review's scan never covered.
source "$(dirname "$0")/lib.sh"
echo "== URF-06 web auth integration oracle =="

T=apps/web/test/session-auth.test.cjs
E=apps/web/test/e2e/auth.spec.ts

need_file "$T" 300
need_file "$E" 300

run npm run web:check
run npm run web:test:e2e -- --project=chromium

echo "-- production negative scan: demo flag unset --"
run npm run web:build
absentF "no demo password in bundle" "Welcome@123" dist/apps/web
absentF "no demo employee id in bundle" "PS-100246" dist/apps/web
absent  "no unsigned-token minting in bundle" "alg[\"':[:space:]]+none" dist/apps/web

echo "-- production negative scan: demo flag set (the case the prior scan missed) --"
run bash -c 'VITE_ENABLE_DEMO_LOGIN=true npm run web:build'
absentF "no demo password in flag-on bundle" "Welcome@123" dist/apps/web
absentF "no demo employee id in flag-on bundle" "PS-100246" dist/apps/web
absent  "no unsigned-token minting in flag-on bundle" "alg[\"':[:space:]]+none" dist/apps/web

# regression guards for findings closed earlier in the programme
if [ -f "$T" ]; then
  for g in expiry unauthorized busy generic; do
    has "regression guard present: $g" "$g" "$T"
  done
fi
finish
