#!/usr/bin/env bash
# PH-16E oracle: PS07 append-only credential_verifications (verifier != submitter SoD, VAL-PS07-CREDREF dedup)
# + training_sponsorships service bonds (BREACHED -> BOND_RECOVERY feed gate, VAL-PS07-BOND); PS08 calibration
# as ratified recommendation (ERR-PS08-RATIFY, VAL-DISTRIB diagnostic-only) + PIP lifecycle + probation
# confirmation with extension cap. Behavior + executed tests only.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
must(){ local spec="$1"; shift; local label="${spec%%::*}"; local pat="${spec#*::}"
  if grep -rqE "$pat" "$@" 2>/dev/null; then grn "$label"; else red "missing: $label"; fi; }
S07="apps/api/src/modules/ps07 apps/api/src/routes/ps07.routes.ts"
S08="apps/api/src/modules/ps08 apps/api/src/routes/ps08.routes.ts"
T=apps/api/test

echo "== PH-16E exit-criteria (PS07 credentials/bonds + PS08 calibration/PIP/probation to BRD depth) =="

[ -d node_modules ] || red "node_modules absent — toolchain oracle cannot run; refusing GREEN without it"

# 1) PS07 behavior in module source (BRD entities + registered codes, not markers)
for spec in \
  "credential verification ledger consumed (credential_verifications)::credential_verifications" \
  "duplicate external reference guard (VAL-PS07-CREDREF)::VAL-PS07-CREDREF" \
  "sponsorships consumed (training_sponsorships)::training_sponsorships" \
  "bond breach state (BREACHED)::BREACHED" \
  "recovery cost feed (BOND_RECOVERY)::BOND_RECOVERY" \
  "bond integrity gate (VAL-PS07-BOND)::VAL-PS07-BOND" \
  "recovery amount computed (bond_recovery_amount)::bond_recovery_amount"
do must "$spec" $S07; done

# 2) PS08 behavior in module source
for spec in \
  "calibration recommendations consumed (calibration_recommendations)::calibration_recommendations" \
  "unratified apply guard (ERR-PS08-RATIFY)::ERR-PS08-RATIFY" \
  "diagnostic-only distribution (VAL-DISTRIB)::VAL-DISTRIB" \
  "PIP header consumed (performance_improvement_plans)::performance_improvement_plans" \
  "PIP milestones consumed (pip_milestones)::pip_milestones" \
  "probation decision lifecycle (probation_confirmations)::probation_confirmations" \
  "probation outcome recorded (probation_outcome)::probation_outcome" \
  "extension cap enforced (probation_extension_max_months)::probation_extension_max_months"
do must "$spec" $S08; done

# 3) executed oracle tests
for spec in \
  "NEGATIVE: duplicate credential ref asserted (VAL-PS07-CREDREF)::VAL-PS07-CREDREF" \
  "credential verifier SoD exercised (credential_verifications)::credential_verifications" \
  "NEGATIVE: RECOVERED without BOND_RECOVERY cost asserted (VAL-PS07-BOND)::VAL-PS07-BOND" \
  "NEGATIVE: unratified grade apply asserted (ERR-PS08-RATIFY)::ERR-PS08-RATIFY" \
  "PIP lifecycle exercised (performance_improvement_plans)::performance_improvement_plans" \
  "probation decision + extension cap exercised (probation_confirmations)::probation_confirmations"
do must "$spec" "$T"; done

# 4) suites — RED on any failure
if [ -d node_modules ]; then
  npm run -s typecheck >/dev/null 2>&1 && grn "npm run typecheck green" || red "typecheck failed"
  npm test >/dev/null 2>&1 && grn "npm test green (build + executed api suite)" || red "npm test failed"
fi

echo "== $([ "$fail" -eq 0 ] && echo 'GREEN - PH-16E met' || echo 'RED - PH-16E not complete') =="
exit "$fail"
