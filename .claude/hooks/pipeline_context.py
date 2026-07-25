#!/usr/bin/env python3
"""Lightweight context hook: prints current pipeline state so the agent starts each turn grounded."""
import json, os, sys
root = os.getcwd()
try:
    data = json.load(sys.stdin)
    root = data.get("cwd") or root
except Exception:
    pass
m_path = os.path.join(root, "docs", "spec", "manifest.json")
mode_path = os.path.join(root, ".ai-pipeline", "current-mode.json")
parts = []
try:
    m = json.load(open(m_path))
    parts.append(f"AI pipeline: feature={m.get('feature')} mode={m.get('mode')} current_stage={m.get('current_stage')} run={str(m.get('run_id',''))[:8]}")
    gates = m.get('gates') or {}
    parts.append("Gates: " + ", ".join(f"{g}={v.get('verdict') or 'pending'}" for g,v in gates.items()))
except Exception:
    parts.append("AI pipeline: no docs/spec/manifest.json yet. Use ai-pipeline init before a controlled run.")
try:
    mode = json.load(open(mode_path))
    parts.append(f"ACTIVE PIPELINE MODE: {mode.get('mode')} {mode.get('requirement') or mode.get('change') or ''}")
except Exception:
    pass
print("\n".join(parts))
