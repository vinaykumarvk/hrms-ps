#!/usr/bin/env bash
# PH-06E oracle (human gate support): full API+web suites green, targeted re-greps of the audit's
# previously-NOT_FOUND items closed in PH-06A..D, regression negatives (orders.length+1, generic
# CONFLICT), and an honest coverage-delta verdict at docs/spec/ph-06-verdict.md referencing the
# 2026-07-02 audit with per-module remaining-gap accounting. No plan-file or marker assertions.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
echo "== PH-06E exit-criteria (vertical-slice conformance + scale-up gate) =="

[ -d node_modules ] || red "node_modules absent — typecheck/test oracle cannot run (npm install required)"
PS03=apps/api/src/modules/ps03
PS05=apps/api/src/modules/ps05

# 1) full suites — RED on failure
npm run -s typecheck >/dev/null 2>&1 && grn "npm run typecheck green" || red "npm run typecheck FAILED"
npm test --silent >/dev/null 2>&1 && grn "npm test green" || red "npm test FAILED"
npm run -s web:typecheck >/dev/null 2>&1 && grn "npm run web:typecheck green" || red "npm run web:typecheck FAILED"
npm run -s web:test >/dev/null 2>&1 && grn "npm run web:test green" || red "npm run web:test FAILED"

# 2) re-greps of previously-NOT_FOUND audit items ("label::pattern::path" indexed list)
for spec in \
  "PS03 LEAVE_OVERLAP emitted::LEAVE_OVERLAP::$PS03" \
  "PS03 INSUFFICIENT_BALANCE emitted::INSUFFICIENT_BALANCE::$PS03" \
  "PS03 OPTIMISTIC_LOCK_CONFLICT emitted::OPTIMISTIC_LOCK_CONFLICT::$PS03" \
  "PS03 withdraw behavior::withdraw[A-Za-z]* *\(::$PS03" \
  "PS03 holiday calendar consumed::holiday::$PS03" \
  "PS05 catalog code RELIEVING::\"RELIEVING\"::$PS05" \
  "PS05 catalog code JOINING::\"JOINING\"::$PS05" \
  "PS05 gapless sequence entity::order_?number_?sequence::$PS05" \
  "PS05 last working day::last_?working_?day|lastWorkingDay::$PS05" \
  "PS05 reversal-envelope cancel::reverseFromSource|reversalOfEventId|ingest/reversal::$PS05" \
  "PS03 service uses repository::repositor::$PS03" \
  "PS05 service uses repository::repositor::$PS05" \
  "web ps03 interactive form::onSubmit::apps/web/src/modules/ps03" \
  "web ps05 interactive form::onSubmit::apps/web/src/modules/ps05" \
; do
  label="${spec%%::*}"; rest="${spec#*::}"; pat="${rest%%::*}"; path="${rest#*::}"
  grep -rqiE "$pat" "$path" 2>/dev/null && grn "$label" || red "regressed/missing: $label"
done

# 3) fail-closed regression negatives (audit findings must not return)
grep -qF 'orders.length + 1' apps/api/src/modules/ps05/transferService.ts 2>/dev/null \
  && red "NEGATIVE: orders.length+1 numbering regressed" || grn "negative ok: no orders.length+1 numbering"
grep -rqF '"CONFLICT", "Leave balance is insufficient"' "$PS03" 2>/dev/null \
  && red "NEGATIVE: generic CONFLICT for balance regressed" || grn "negative ok: named INSUFFICIENT_BALANCE retained"
grep -rqE 'TRANSFER_JOINED|TRANSFER_RETAINED|TRANSFER_DEEMED_RELIEVED' "$PS05" 2>/dev/null \
  && red "NEGATIVE: non-catalog SR codes regressed in ps05" || grn "negative ok: only frozen-catalog SR codes in ps05"

# 4) honest coverage-delta verdict for the human gate
V=docs/spec/ph-06-verdict.md
if [ ! -s "$V" ] || [ "$(wc -c < "$V")" -lt 1500 ]; then
  red "missing/too-small coverage-delta verdict: $V (needs the real delta table, not a stub)"
else
  grn "verdict present: $V"
  grep -q 'brd-coverage-audit-20260702' "$V" && grn "verdict references the baseline audit" || red "verdict does not reference brd-coverage-audit-20260702"
  grep -qE '\|.*PS03' "$V" && grep -qE '\|.*PS05' "$V" && grn "verdict has per-module delta table rows (PS03, PS05)" || red "verdict lacks per-module delta table rows"
  grep -qiE 'NOT_FOUND|remaining' "$V" && grn "verdict accounts for remaining gaps" || red "verdict hides remaining gaps (no NOT_FOUND/remaining accounting)"
  grep -qiE 'apps/(api|web)/src[^ ]*' "$V" && grn "verdict cites implementing files as evidence" || red "verdict cites no file evidence"
fi

echo "== $([ "$fail" -eq 0 ] && echo 'GREEN — PH-06E met (park for human scale-up approval)' || echo 'RED — PH-06E not complete') =="
exit "$fail"
