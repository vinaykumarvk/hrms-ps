#!/usr/bin/env bash
# Shared oracle helpers for the UI-remediation-follow-up pipeline.
#
# Deliberately grep-based, not ripgrep-based. `rg` is not installed on this machine — in an
# interactive Claude Code shell it resolves to a shell function, but the pipeline driver runs
# checks in a plain bash environment where `rg` does not exist. A missing binary made
# `! rg pattern file` succeed, which turned every negative assertion into a silent PASS.
# An oracle that cannot run must go RED, never green.

set -uo pipefail
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
fail=0

red(){ echo "  RED  $*"; fail=1; }
grn(){ echo "  ok   $*"; }

# hard-fail on a missing tool rather than letting an assertion pass vacuously
require_tool(){ command -v "$1" >/dev/null 2>&1 || { echo "  RED  required tool not found: $1"; fail=1; }; }
require_tool grep
require_tool git

need_file(){
  if [ -s "$1" ] && [ "$(wc -c < "$1")" -ge "${2:-1}" ]; then grn "$1"; else red "missing/too-small: $1"; fi
}

need_dir_files(){   # need_dir_files <dir> <min-count>
  if [ -d "$1" ] && [ "$(find "$1" -type f | wc -l)" -ge "${2:-1}" ]; then grn "$1 (>= ${2:-1} files)"; else red "missing/incomplete dir: $1"; fi
}

run(){ "$@" && grn "$*" || red "$*"; }

# has <label> <ERE> <file...>   — RED if the pattern is absent OR any file is missing
has(){
  local label="$1" pat="$2"; shift 2
  local f; for f in "$@"; do [ -f "$f" ] || { red "$label — file absent: $f"; return; }; done
  if grep -Eqi -- "$pat" "$@"; then grn "$label"; else red "$label — not found"; fi
}

# hasF <label> <literal> <file...>
hasF(){
  local label="$1" pat="$2"; shift 2
  local f; for f in "$@"; do [ -f "$f" ] || { red "$label — file absent: $f"; return; }; done
  if grep -Fq -- "$pat" "$@"; then grn "$label"; else red "$label — not found"; fi
}

# absent <label> <ERE> <path...>  — RED if the pattern is present OR a path is missing.
# The missing-path case is the important one: a negative assertion against a file that does
# not exist proves nothing and must not report ok.
absent(){
  local label="$1" pat="$2"; shift 2
  local p; for p in "$@"; do [ -e "$p" ] || { red "$label — path absent, assertion is vacuous: $p"; return; }; done
  if grep -rEqis -- "$pat" "$@"; then red "$label — present"; else grn "$label"; fi
}

# absentF <label> <literal> <path...>
absentF(){
  local label="$1" pat="$2"; shift 2
  local p; for p in "$@"; do [ -e "$p" ] || { red "$label — path absent, assertion is vacuous: $p"; return; }; done
  if grep -rFqs -- "$pat" "$@"; then red "$label — present"; else grn "$label"; fi
}

cnt(){ grep -Ec -- "$1" "$2" 2>/dev/null || true; }   # count matching lines, 0 when absent

# no_placeholders <path...>
# Matches placeholder MARKERS, case-sensitively. Deliberately not `grep -i`: evidence files must
# paste command output verbatim and may not be edited to satisfy a check, and real tool output
# contains lowercase words that look like markers — node:test prints "ℹ todo 0" in every summary.
# Case-sensitive uppercase markers are the convention for unfilled content and do not collide.
no_placeholders(){
  local p; for p in "$@"; do [ -e "$p" ] || { red "no placeholder markers — path absent, assertion is vacuous: $p"; return; }; done
  if grep -rEqs -- '(\bTBD\b|\bTODO\b|\bFIXME\b|\bXXX\b|<fill[ -]?in>|to be decided)' "$@"; then
    red "no placeholder markers — present"
  else
    grn "no placeholder markers"
  fi
}

finish(){ echo "== $([ "$fail" -eq 0 ] && echo GREEN || echo RED) =="; exit "$fail"; }
