#!/usr/bin/env bash
# PH-09A oracle: persisted, effective-dated rule substrate for PS10/PS11 (pay_components, pay_rules,
# rate_tables, and PS11 rule tables E30-E36) CONSUMED by code and proven by executed tests.
# No marker strings, no plan/prompt existence, no phases.yaml wiring — behavior + green suite only.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
# must "label::ERE" path...  -> greps the files directly (BSD grep, no \b)
must(){ local spec="$1"; shift; local label="${spec%%::*}"; local pat="${spec#*::}"
  if grep -rqE "$pat" "$@" 2>/dev/null; then grn "$label"; else red "missing: $label"; fi; }
S10="apps/api/src/modules/ps10 apps/api/src/routes/ps10.routes.ts"
S11="apps/api/src/modules/ps11 apps/api/src/routes/ps11.routes.ts"
T=apps/api/test

echo "== PH-09A exit-criteria (PS10/PS11 rule substrate: real entities, effective dating, negative tests) =="

[ -d node_modules ] || red "node_modules absent — toolchain oracle cannot run; refusing GREEN without it"

# 1) PS10 rule substrate consumed in module source
for spec in \
  "pay_components entity consumed::pay_components" \
  "pay_rules entity consumed::pay_rules" \
  "rate_tables entity consumed::rate_tables" \
  "DSL token whitelist rejects bad expr (ERR-PS10-RULE-EXPR)::ERR-PS10-RULE-EXPR" \
  "rate-table overlap rejected on write (ERR-PS10-RATE-OVERLAP)::ERR-PS10-RATE-OVERLAP" \
  "as-of miss fails closed (ERR-PS10-RATE-NOTFOUND)::ERR-PS10-RATE-NOTFOUND" \
  "PT slabs state-dimensioned (ERR-PS10-PT-STATE)::ERR-PS10-PT-STATE" \
  "effective-dated rows (effective_from/effectiveFrom)::effective_from|effectiveFrom"
do must "$spec" $S10; done

# 2) PS11 rule tables E30-E36 consumed in module source
for spec in \
  "E30 pen_da_relief_rates::pen_da_relief_rates" \
  "E31 pen_commutation_factors::pen_commutation_factors" \
  "E32 pen_family_pension_rates::pen_family_pension_rates" \
  "E33 pen_gratuity_ceilings::pen_gratuity_ceilings" \
  "E34 pen_retirement_age_rules::pen_retirement_age_rules" \
  "E35 pen_pension_limit_rules::pen_pension_limit_rules" \
  "E36 pen_rounding_rules::pen_rounding_rules" \
  "off-window lookup fails closed (ERR-PS11-RULE-NOT-EFFECTIVE)::ERR-PS11-RULE-NOT-EFFECTIVE" \
  "factor miss fails closed (ERR-PS11-FACTOR-NOT-FOUND)::ERR-PS11-FACTOR-NOT-FOUND"
do must "$spec" $S11; done

# 3) executed oracle tests (apps/api/test is what `npm test` runs)
for spec in \
  "effective-date resolution exercised against rate_tables::rate_tables" \
  "NEGATIVE: overlap rejection asserted (ERR-PS10-RATE-OVERLAP)::ERR-PS10-RATE-OVERLAP" \
  "NEGATIVE: DSL whitelist rejection asserted (ERR-PS10-RULE-EXPR)::ERR-PS10-RULE-EXPR" \
  "commutation factor as-of lookup exercised (pen_commutation_factors)::pen_commutation_factors"
do must "$spec" "$T"; done

# 4) suites — RED on any failure
if [ -d node_modules ]; then
  npm run -s typecheck >/dev/null 2>&1 && grn "npm run typecheck green" || red "typecheck failed"
  npm test >/dev/null 2>&1 && grn "npm test green (build + executed api suite)" || red "npm test failed"
fi

echo "== $([ "$fail" -eq 0 ] && echo 'GREEN - PH-09A met' || echo 'RED - PH-09A not complete') =="
exit "$fail"
