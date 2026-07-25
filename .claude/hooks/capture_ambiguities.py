#!/usr/bin/env python3
"""
PostToolUse hook (Write|Edit) — collects `# AMBIGUITY:` markers from any file
just written into <project>/reports/ambiguities.md for centralised review.
Non-blocking; never fails the tool call.
"""
import sys, json, os, re
from datetime import datetime

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

tool_name = data.get("tool_name", "")
tool_input = data.get("tool_input", {}) or {}

if tool_name not in ("Write", "Edit"):
    sys.exit(0)

file_path = tool_input.get("file_path") or tool_input.get("path") or ""
if not file_path or not os.path.exists(file_path):
    sys.exit(0)

try:
    with open(file_path, encoding="utf-8", errors="replace") as f:
        content = f.read()
except Exception:
    sys.exit(0)

found = re.findall(r"#\s*AMBIGUITY:\s*(.+?)(?:\n|$)", content, re.IGNORECASE)
if not found:
    sys.exit(0)

project_dir = data.get("cwd") or os.getcwd()
reports_dir = os.path.join(project_dir, "reports")
try:
    os.makedirs(reports_dir, exist_ok=True)
    with open(os.path.join(reports_dir, "ambiguities.md"), "a") as f:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        try:
            rel = os.path.relpath(file_path, project_dir)
        except ValueError:
            rel = file_path
        for amb in found:
            f.write(f"- [{ts}] `{rel}`: {amb.strip()}\n")
except Exception:
    sys.exit(0)

word = "y" if len(found) == 1 else "ies"
print(f"⚠ {len(found)} ambiguit{word} captured from {os.path.basename(file_path)} → reports/ambiguities.md")
sys.exit(0)
