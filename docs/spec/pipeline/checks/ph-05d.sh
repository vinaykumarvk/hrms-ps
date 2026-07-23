#!/usr/bin/env bash
# PH-05D oracle: PS01/PS12/PS13 foundation record views — asserts REAL build outcomes.
# Re-baselined 2026-07-02 after docs/reviews/brd-coverage-audit-20260702.md found the record
# views render fixture props with zero API calls (DocumentVaultView has no fetch/useEffect).
# This oracle asserts: each view fetches through the API client, renders the BRD field lists,
# shows masked PII for PS01 (aadhaar XXXX-XXXX-1234 style), PS12 timeline exposes cursor paging,
# PS13 renders documents with legal-hold/retention, all with loading/error branches, and green
# toolchains. bash 3.2 / BSD grep compatible.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
echo "== PH-05D exit-criteria (PS01/PS12/PS13 record views) =="

# --- 1. Every foundation view fetches from the API (FAIL-CLOSED on fixture-only rendering) ---------
for m in ps01 ps12 ps13; do
  d="apps/web/src/modules/$m"
  if grep -rn 'from "../../api/\|from "\.\./\.\./api/' "$d" 2>/dev/null | grep -q .; then
    grn "$m view imports the API client"
  else red "$m view never imports the API client (fixture-props rendering, audit finding)"; fi
  grep -rq 'useEffect' "$d" 2>/dev/null && grn "$m view loads data on mount (useEffect)" || red "$m view has no data-loading effect"
  for state in loading error; do
    grep -rqi "$state" "$d" 2>/dev/null && grn "$m view handles state: $state" || red "$m view missing state branch: $state"
  done
done

# --- 2. PS01: rendered field list + masked PII display ------------------------------------------------
ps01=apps/web/src/modules/ps01
grep -rq 'serviceNo' "$ps01" 2>/dev/null && grn "PS01 renders service number" || red "PS01 view does not render serviceNo"
grep -rq 'displayName' "$ps01" 2>/dev/null && grn "PS01 renders display name" || red "PS01 view does not render displayName"
grep -rqiE 'designation|org' "$ps01" 2>/dev/null && grn "PS01 renders designation/org placement" || red "PS01 view does not render designation/org fields"
grep -rqi 'aadhaar' "$ps01" 2>/dev/null && grn "PS01 surfaces Aadhaar as a governed field" || red "PS01 view does not surface Aadhaar"
grep -rqiE 'XXXX|masked' "$ps01" 2>/dev/null && grn "PS01 shows masked PII display (P02)" || red "PS01 view has no masked-PII display"
grep -rq 'fieldGrants' "$ps01" 2>/dev/null && grn "PS01 masking driven by fieldGrants" || red "PS01 masking not driven by fieldGrants"

# --- 3. PS12: timeline with cursor paging --------------------------------------------------------------
ps12=apps/web/src/modules/ps12
grep -rqiE 'cursor|load more|loadMore' "$ps12" 2>/dev/null && grn "PS12 timeline pages by cursor" || red "PS12 timeline has no cursor paging affordance"
grep -rq 'entryHash' "$ps12" 2>/dev/null && grn "PS12 timeline renders hash-chain evidence" || red "PS12 timeline missing hash-chain fields"
grep -rqiE 'append-only|reversal|corrigendum' "$ps12" 2>/dev/null && grn "PS12 timeline reflects ledger semantics" || red "PS12 timeline lacks ledger semantics"

# --- 4. PS13: document vault backed by the API ----------------------------------------------------------
ps13=apps/web/src/modules/ps13
grep -rqiE 'legalHold|legal_hold' "$ps13" 2>/dev/null && grn "PS13 renders legal-hold state" || red "PS13 view missing legal-hold state"
grep -rqi 'retention' "$ps13" 2>/dev/null && grn "PS13 renders retention state" || red "PS13 view missing retention state"
grep -rqiE 'version' "$ps13" 2>/dev/null && grn "PS13 renders document versions" || red "PS13 view missing versions"

# --- 5. Behavioural records test exists AND suites pass -------------------------------------------------
t=apps/web/test/ph05-records.test.cjs
if [ -s "$t" ]; then
  grn "records test present: $t"
  grep -qiE 'fetch|client' "$t" && grn "test asserts API-backed rendering" || red "test does not assert API-backed rendering"
  grep -qiE 'masked|XXXX' "$t" && grn "test asserts masked-PII display" || red "test does not assert masked-PII display"
  grep -qiE 'cursor|load more|loadMore' "$t" && grn "test asserts timeline paging" || red "test does not assert timeline paging"
else red "missing records behaviour test: $t"; fi

# --- 6. Hygiene + toolchain (RED on fail; RED if deps absent — code phase) ------------------------------
if grep -rn 'fixtureHrmsClient\|createFixtureHrmsClient' apps/web/src/modules 2>/dev/null | grep -q .; then
  red "module views import the fixture client (must consume the real client)"
else grn "no fixture client in module views"; fi
if grep -rn 'console\.log\|localhost' apps/web/src 2>/dev/null | grep -q .; then
  red "console.log/localhost in web src"; else grn "web src hygiene clean"; fi
if [ -d node_modules ]; then
  npm run -s typecheck >/dev/null 2>&1 && grn "npm typecheck passes" || red "npm typecheck failed"
  npm test >/dev/null 2>&1 && grn "npm test passes (API suite)" || red "npm test failed"
  npm run -s web:typecheck >/dev/null 2>&1 && grn "npm web:typecheck passes" || red "npm web:typecheck failed"
  npm run -s web:test >/dev/null 2>&1 && grn "npm web:test passes" || red "npm web:test failed"
else
  red "node_modules absent — PH-05D is a code phase; run npm install, then all four checks must pass"
fi

echo "== $([ $fail -eq 0 ] && echo 'GREEN — PH-05D met' || echo 'RED — PH-05D not complete') =="; exit $fail
