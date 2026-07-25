#!/usr/bin/env bash
# URF-01 oracle: STRUCTURAL ONLY.
# This phase's product is a security decision, and no command can grade a decision. This check
# verifies the amendments exist, are decided, and are owned. The manifest keeps URF-01 on
# gate: human so a person ratifies the content. Do not promote this phase to gate: auto.
source "$(dirname "$0")/lib.sh"
echo "== URF-01 amendment structure oracle (gate: human — content is not machine-gradable) =="

A=docs/spec/ui-remediation-followup/auth-contract-amendment.md
P=docs/spec/ui-remediation-followup/deployment-security-policy.md
T=docs/spec/ui-remediation-followup/threat-model.md
R=docs/spec/ui-remediation-followup/scope-conflict-register.yaml

need_file "$A" 1200
need_file "$P" 800
need_file "$T" 600
need_file "$R" 300

if [ -f "$A" ] && [ -f "$P" ] && [ -f "$R" ]; then
  for d in D-AUTH-01 D-AUTH-02 D-AUTH-03 D-SEC-01; do
    hasF "decision present: $d" "$d" "$A" "$P" "$R"
  done
  has "decisions carry owners" "owner" "$A" "$P" "$R"
fi

# the auth amendment must name concrete mechanics, not intentions
if [ -f "$A" ]; then
  for k in issuer audience algorithm lifetime; do
    has "auth amendment specifies: $k" "$k" "$A"
  done
fi

# the deployment policy must name the header set, header by header
if [ -f "$P" ]; then
  for h in Content-Security-Policy Strict-Transport-Security X-Content-Type-Options Referrer-Policy Permissions-Policy; do
    hasF "policy specifies: $h" "$h" "$P"
  done
fi

# dark theme shipped in commit 1d68603; it must not still be carried as deferred
absent "dark theme no longer listed as deferred" "dark (theme|mode)[^.]{0,40}defer" \
       docs/spec/ui-remediation-followup

no_placeholders "$A" "$P"
finish
