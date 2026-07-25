#!/usr/bin/env bash
# URF-04 oracle: the contract parses, the endpoints behave, and the error model holds.
source "$(dirname "$0")/lib.sh"
echo "== URF-04 auth API contract oracle =="

C=docs/contracts/openapi/AUTH.yaml
T=apps/api/test/auth-endpoints.test.cjs

need_file "$C" 500
need_file "$T" 400

run python3 -c "import yaml,sys; yaml.safe_load(open('$C'))"

if [ -f "$C" ]; then
  for p in login refresh logout; do
    has "contract covers: $p" "$p" "$C"
  done
fi

run node --test "$T"

if [ -f "$T" ]; then
  for c in invalid revoke correlation; do
    has "endpoint case covered: $c" "$c" "$T"
  done
fi

# the rate-limiting posture must be stated somewhere, even if the answer is "none, accepted"
has "rate-limiting posture stated" "rate.?limit|lockout|throttl" \
    "$C" docs/spec/ui-remediation-followup/auth-contract-amendment.md

run npm run check
finish
