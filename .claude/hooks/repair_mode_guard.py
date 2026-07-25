#!/usr/bin/env python3
"""PreToolUse guard enforcing repair mode: implementation-only edits."""
import sys, json, os, re
DEFAULT_BLOCKED=["docs/spec/","docs/lld/","tests/acceptance/","tests/e2e/","schemas/"]
def allow(): sys.exit(0)
def block(m): sys.stderr.write(m+"\n"); sys.exit(2)
PATCH_TEXT_KEYS=('command','patch','input','diff','content','text','changes')
def _patch_text(ti):
    """Codex apply_patch payload key is not standardised across versions; gather text from
    any plausible field (and fall back to every string value) so the guard cannot be
    silently bypassed by a payload-shape change."""
    parts=[ti[k] for k in PATCH_TEXT_KEYS if isinstance(ti.get(k),str) and ti[k]]
    if not parts: parts=[v for v in ti.values() if isinstance(v,str)]
    return '\n'.join(parts)
def paths_from(data):
    ti=data.get('tool_input') or {}; tool=data.get('tool_name')
    if tool in ('Write','Edit'):
        p=ti.get('file_path') or ti.get('path') or ''; return [p] if p else []
    if tool=='apply_patch':
        cmd=_patch_text(ti); paths=[]
        for pat in (r"\*\*\* (?:Add|Update|Delete) File: ([^\n]+)", r"\+\+\+ b/([^\n]+)", r"--- a/([^\n]+)"):
            paths.extend(re.findall(pat,cmd))
        return list(dict.fromkeys(p.strip() for p in paths if p.strip()))
    return []
def main():
    try: data=json.load(sys.stdin)
    except Exception: allow()
    if data.get('tool_name') not in ('Write','Edit','apply_patch'): allow()
    root=data.get('cwd') or os.getcwd(); mode_path=os.path.join(root,'.ai-pipeline','current-mode.json')
    if not os.path.exists(mode_path): allow()
    try: mode=json.load(open(mode_path))
    except Exception: allow()
    if mode.get('mode')!='repair': allow()
    blocked=mode.get('blocked_paths') or DEFAULT_BLOCKED
    for p in paths_from(data):
        rel=p[len(root):].lstrip('/') if p.startswith(root) else p.lstrip('/')
        for b in blocked:
            b=b.strip('/')+'/'
            if rel.startswith(b) or ('/'+b) in ('/'+rel):
                req=mode.get('requirement','?')
                block(f"BLOCKED (REPAIR MODE for {req}): repair may modify implementation only — '{rel}' is a spec/design/oracle path. Use `ai-pipeline amend --change <element>` if the spec is wrong.")
    allow()
if __name__=='__main__': main()
