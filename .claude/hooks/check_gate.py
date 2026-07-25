#!/usr/bin/env python3
"""
PreToolUse hook (Write|Edit) — blocks writes to src/ until Gate C is signed off
in <project>/manifest.json. Fails OPEN when there is no manifest, so it is a
no-op for projects that don't use the AI Dev Pipeline.

Exit 2 = block. Exit 0 = allow.
Reads JSON event payload from stdin.
"""
import sys, json, os

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

tool_name = data.get("tool_name", "")
tool_input = data.get("tool_input", {}) or {}

if tool_name not in ("Write", "Edit"):
    sys.exit(0)

file_path = tool_input.get("file_path") or tool_input.get("path") or ""
if not file_path:
    sys.exit(0)

# Only enforce for src/ writes (relative or under the project root)
project_dir = data.get("cwd") or os.getcwd()
try:
    rel = os.path.relpath(file_path, project_dir)
except ValueError:
    rel = file_path
norm = rel.lstrip("./")
if not norm.startswith("src/"):
    sys.exit(0)

manifest_path = os.path.join(project_dir, "manifest.json")
if not os.path.exists(manifest_path):
    sys.exit(0)  # No manifest — pipeline not initialised, allow

try:
    with open(manifest_path) as f:
        m = json.load(f)
except Exception:
    sys.exit(0)

gate_c = (m.get("gates", {}) or {}).get("C", {}).get("signed_off", False)
if gate_c:
    sys.exit(0)

gates = {k: v.get("signed_off", False) for k, v in (m.get("gates", {}) or {}).items()}
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "additionalContext": (
            f"BLOCKED: Writing to src/ requires Gate C sign-off.\n"
            f"Current gates: {gates}\n"
            f"Run: /quality-gate-checker C"
        ),
    }
}))
sys.exit(2)
