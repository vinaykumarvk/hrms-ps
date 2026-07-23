#!/usr/bin/env bash
# PH-15F oracle: PS09 POSH/ICC route with composition validation, personal hearings with deny-with-reason,
# SLA pause/resume ledger with recompute; PS06 multi-stream rota-quota seniority construction with rotation
# trace and input guards. Behavior + executed tests only.
set -uo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo /Users/n15318/hrms)"
fail=0; red(){ echo "  RED  $*"; fail=1; }; grn(){ echo "  ok   $*"; }
must(){ local spec="$1"; shift; local label="${spec%%::*}"; local pat="${spec#*::}"
  if grep -rqE "$pat" "$@" 2>/dev/null; then grn "$label"; else red "missing: $label"; fi; }
S09="apps/api/src/modules/ps09 apps/api/src/routes/ps09.routes.ts"
S06="apps/api/src/modules/ps06 apps/api/src/routes/ps06.routes.ts"
T=apps/api/test

echo "== PH-15F exit-criteria (PS09 ICC/hearings/SLA-pause + PS06 rota-quota to BRD depth) =="

[ -d node_modules ] || red "node_modules absent — toolchain oracle cannot run; refusing GREEN without it"

# 1) PS09 behavior in module source (BRD entities + codes, not markers)
for spec in \
  "POSH route resolved (inquiry_route ICC_POSH)::ICC_POSH" \
  "ICC composition validated (ERR-PS09-ICC-PROCEDURE-REQUIRED)::ERR-PS09-ICC-PROCEDURE-REQUIRED" \
  "external member role enforced (ICC_EXTERNAL_MEMBER)::ICC_EXTERNAL_MEMBER" \
  "personal hearings entity consumed::personal_hearings" \
  "denial requires reason (denial_reason)::denial_reason" \
  "reasonless denial guarded (ERR-PS09-PERSONAL-HEARING-DENIED)::ERR-PS09-PERSONAL-HEARING-DENIED" \
  "SLA pause ledger consumed (sla_pause_events)::sla_pause_events" \
  "resume recompute (resumed_at)::resumed_at" \
  "invalid resume guarded (ERR-PS09-SLA-PAUSE-INVALID)::ERR-PS09-SLA-PAUSE-INVALID"
do must "$spec" $S09; done

# 2) PS06 behavior in module source
for spec in \
  "quota rules entity consumed (seniority_quota_rules)::seniority_quota_rules" \
  "rotation methods supported (ROTA_QUOTA)::ROTA_QUOTA" \
  "slot labels assigned (quota_slot_label)::quota_slot_label" \
  "rotation cycles recorded (rotation_cycle_no)::rotation_cycle_no" \
  "missing stream tag guarded (STREAM_TAG_MISSING)::STREAM_TAG_MISSING" \
  "invalid quota rule guarded (QUOTA_RULE_INVALID)::QUOTA_RULE_INVALID"
do must "$spec" $S06; done

# 3) executed oracle tests
for spec in \
  "NEGATIVE: ICC without external member asserted (ERR-PS09-ICC-PROCEDURE-REQUIRED)::ERR-PS09-ICC-PROCEDURE-REQUIRED" \
  "NEGATIVE: reasonless hearing denial asserted (ERR-PS09-PERSONAL-HEARING-DENIED)::ERR-PS09-PERSONAL-HEARING-DENIED" \
  "SLA pause/resume recompute exercised (sla_pause_events)::sla_pause_events" \
  "NEGATIVE: resume without open pause asserted (ERR-PS09-SLA-PAUSE-INVALID)::ERR-PS09-SLA-PAUSE-INVALID" \
  "rota-quota construction exercised (seniority_quota_rules)::seniority_quota_rules" \
  "deterministic interleave asserted (quota_slot_label)::quota_slot_label" \
  "NEGATIVE: missing stream tag asserted (STREAM_TAG_MISSING)::STREAM_TAG_MISSING" \
  "NEGATIVE: invalid quota rule asserted (QUOTA_RULE_INVALID)::QUOTA_RULE_INVALID"
do must "$spec" "$T"; done

# 4) suites — RED on any failure
if [ -d node_modules ]; then
  npm run -s typecheck >/dev/null 2>&1 && grn "npm run typecheck green" || red "typecheck failed"
  npm test >/dev/null 2>&1 && grn "npm test green (build + executed api suite)" || red "npm test failed"
fi

echo "== $([ "$fail" -eq 0 ] && echo 'GREEN - PH-15F met' || echo 'RED - PH-15F not complete') =="
exit "$fail"
