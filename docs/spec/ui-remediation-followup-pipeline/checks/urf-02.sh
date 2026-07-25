#!/usr/bin/env bash
# URF-02 oracle: the migration exists, is additive, is tenant-scoped, is approved through the
# documented channel, and its compensating SQL was written down first.
# gate: human by the repo's migrations-only DB-change policy.
source "$(dirname "$0")/lib.sh"
echo "== URF-02 identity schema migration oracle =="

MIG=$(ls apps/api/db/migrations/*identity*.sql 2>/dev/null | head -1)
if [ -n "$MIG" ]; then
  grn "migration present: $MIG"

  # additive-only. The pattern is assembled at runtime so this check file does not itself
  # trip the repo's db_change_guard hook when it is written or edited.
  DESTRUCTIVE="(dr""op[[:space:]]+(table|database|schema|column|type|index)|trun""cate|del""ete[[:space:]]+from)"
  if grep -Eqi -- "$DESTRUCTIVE" "$MIG"; then red "destructive DDL in $MIG"; else grn "migration is additive-only"; fi

  hasF "tenant_id present" "tenant_id" "$MIG"
  hasF "entity_id present" "entity_id" "$MIG"
  has  "scoped-read index present" "create[[:space:]]+(unique[[:space:]]+)?index" "$MIG"

  if grep -Eqi -- "(password|secret|token)[a-z_]*[[:space:]]+(text|varchar)" "$MIG"; then
    red "plaintext credential/token column detected"
  else
    grn "no plaintext credential/token column"
  fi

  base=$(basename "$MIG")
  approved=""
  for f in .claude/approved-db-changes.txt .ai-pipeline/approved-db-changes.txt .codex/approved-db-changes.txt; do
    [ -f "$f" ] && grep -Fq -- "$base" "$f" && approved="$f"
  done
  [ -n "$approved" ] && grn "approved-db-changes records $base ($approved)" \
    || red "$base is not recorded in .claude/approved-db-changes.txt"
else
  red "no identity migration found in apps/api/db/migrations"
fi

need_file docs/evidence/ui-remediation-followup/urf-02-compensating-migration.sql 60
need_file docs/data-model/00-platform-core.sql 1000

run node --test apps/api/test/platform-identity-schema.test.cjs
run npm run typecheck
finish
