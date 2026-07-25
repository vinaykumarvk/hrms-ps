#!/usr/bin/env bash
# URF-03 oracle: the negative-case suite is the primary evidence. The source assertions below
# are regression guards against the two specific paths FR-02 named — they are guards, not
# closure evidence, and the phase does not pass on them alone.
source "$(dirname "$0")/lib.sh"
echo "== URF-03 token verification oracle =="

V=apps/api/src/platform/authorization/tokenVerification.ts
T=apps/api/test/auth-token-verification.test.cjs

need_file "$V" 400
need_file "$T" 400

run node --test "$T"

# a green suite only means something if it covers the right cases
if [ -f "$T" ]; then
  for c in alg signature expired issuer audience tenant; do
    has "negative case covered: $c" "$c" "$T"
  done
fi

# FR-02 regression guards: no default tenant/entity substitution, no unverified claim decode
absent "no default tenant/entity substitution in server.mjs" "ph03Ids\.(tenant|entity)" server.mjs
absent "no unverified claim decode in server.mjs" "JSON\.parse\(Buffer\.from\(segments\[1\]" server.mjs

has "bridge has a production guard" "production" tools/local-api-server.mjs

run npm run check
finish
