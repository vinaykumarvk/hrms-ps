#!/usr/bin/env bash
# Exit-criteria for <PHASE>. The INDEPENDENT ORACLE — run by the driver, OUTSIDE the model.
# Exits 0 (GREEN) only if every check passes. Prefer real assertions (files exist + parse, build/typecheck,
# tests pass, schema loads, contract $refs resolve). Never assert something the agent merely claims.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd)"
fail=0
red(){ echo "  RED  $*"; fail=1; }
grn(){ echo "  ok   $*"; }
need_file(){ if [ -s "$1" ] && [ "$(wc -c < "$1")" -ge "${2:-1}" ]; then grn "$1"; else red "missing/too-small: $1"; fi; }

echo "== <PHASE> exit-criteria =="

# 1) Required artifacts exist and are non-trivial
# need_file docs/spec/<artifact>.md 300

# 2) It builds / typechecks / tests pass (uncomment the real commands)
# npm --prefix <pkg> run -s typecheck >/dev/null 2>&1 && grn "typecheck" || red "typecheck failed"
# npm --prefix <pkg> test --silent   >/dev/null 2>&1 && grn "tests"     || red "tests failed"

# 3) A machine-readable contract parses (example)
# python3 - <<'PY' || red "contract invalid"
# import yaml,sys; yaml.safe_load(open("docs/contracts/<x>.yaml")); print("  ok   contract parses"); sys.exit(0)
# PY

# 4) Runtime manifest records this phase's verdict (example)
# grep -q '"<PHASE>"' docs/spec/manifest.json && grn "manifest records <PHASE>" || red "manifest missing <PHASE>"

echo "== $([ $fail -eq 0 ] && echo 'GREEN — <PHASE> exit-criteria met' || echo 'RED — <PHASE> not complete') =="
exit $fail
