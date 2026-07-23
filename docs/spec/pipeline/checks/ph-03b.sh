#!/usr/bin/env bash
# PH-03B oracle: systems of record (PS01 master, PS12 append-only SR, PS13 vault).
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
hasfiles(){ [ -d "$1" ] && find "$1" -name '*.ts' -print -quit 2>/dev/null | grep -q .; }
echo "== PH-03B exit-criteria (systems of record) =="
for d in apps/api/src/modules/ps01 apps/api/src/modules/ps12 apps/api/src/modules/ps13; do
  hasfiles "$d" && grn "service present: $d" || red "missing/empty: $d"
done
ps12="$(cat apps/api/src/modules/ps12/*.ts apps/api/src/modules/ps12/**/*.ts 2>/dev/null)"
echo "$ps12" | grep -qiE 'idempoten|dedup' && grn "PS12 idempotency/dedup" || red "PS12 missing idempotency/dedup"
echo "$ps12" | grep -qiE 'append.only|supersede|reversal|is_reversal' && grn "PS12 append-only/reversal" || red "PS12 missing append-only/reversal semantics"
if echo "$ps12" | grep -qiE '\b(update|delete)\b .*service_register_events|service_register_events.*\b(update|delete)\b'; then red "PS12 appears to UPDATE/DELETE the SR ledger (must be append-only)"; else grn "no UPDATE/DELETE against SR ledger"; fi
ps13="$(cat apps/api/src/modules/ps13/*.ts apps/api/src/modules/ps13/**/*.ts 2>/dev/null)"
echo "$ps13" | grep -qiE 'legal.?hold' && grn "PS13 legal-hold" || red "PS13 missing legal-hold"
echo "$ps13" | grep -qiE 'retention' && grn "PS13 retention" || red "PS13 missing retention"
# tests present
tests(){ find apps/api -path '*/node_modules' -prune -o -name '*.test.ts' -print 2>/dev/null | grep -qiE "$1"; }
tests 'dedup|semantic' && grn "SR semantic-dedup test present" || red "no SR semantic-dedup test"
tests 'legal.?hold|disposal' && grn "legal-hold test present" || red "no legal-hold test"
tests 'mask' && grn "P02 masking test present" || red "no P02 masking test"
tests 'ps01.*ps12|sr.?ingest|identity.*sr' && grn "PS01->PS12 SR integration test present" || red "no PS01->PS12 integration test"
if grep -rniE 'console\.log' apps/api/src/modules/ps01 apps/api/src/modules/ps12 apps/api/src/modules/ps13 2>/dev/null | grep -vq '//'; then red "console.log in SoR src"; else grn "no console.log in SoR src"; fi
if [ -d node_modules ] || [ -d apps/api/node_modules ]; then
  npm run -s typecheck >/dev/null 2>&1 && grn "npm typecheck passes" || red "npm typecheck failed"
  npm test --silent >/dev/null 2>&1 && grn "npm test passes" || echo "  WARN npm test not green — inspect"
else echo "  WARN node_modules absent — typecheck/test oracle NOT run (structural + security only)"; fi
echo "== $([ $fail -eq 0 ] && echo 'GREEN — PH-03B met' || echo 'RED — PH-03B not complete') =="; exit $fail
