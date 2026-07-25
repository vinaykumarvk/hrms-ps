#!/usr/bin/env bash
# URF-05 oracle: headers are served, and the SPA still works under them. The second half
# matters more than the first — a CSP that breaks the app passes a header test and fails users.
source "$(dirname "$0")/lib.sh"
echo "== URF-05 deployment security header oracle =="

T=apps/api/test/security-headers.test.cjs
O=ops/security-headers-verification.sh

need_file "$T" 300
need_file "$O" 200

run node --test "$T"

if [ -f "$T" ]; then
  for h in Content-Security-Policy Strict-Transport-Security X-Content-Type-Options Referrer-Policy Permissions-Policy; do
    hasF "asserted: $h" "$h" "$T"
  done
fi

# CSP must be composed in the server, not only described in a document
has "server.mjs composes CSP" "content-security-policy" server.mjs

# the SPA must still load and behave under the policy
run npm run web:build
run npm run web:test:e2e -- --project=chromium

run bash "$O"
finish
