#!/usr/bin/env python3
"""PreToolUse guard for DB-change policy. Supports Claude Write/Edit and Codex apply_patch."""
import sys, json, os, re
from datetime import datetime

DEFAULT_CFG={"policy":"migrations","sensitive_tables":[],"migration_dirs":["migrations","db/migrations","supabase/migrations"],"forbidden_commands":[],"config_error":False}
HELP=("To approve intentionally: announce in your DB-changes channel, then either set PIPELINE_DB_OVERRIDE=1 "
      "or add a matching line to .ai-pipeline/approved-db-changes.txt. Overrides are logged to reports/db-guard-overrides.md.")

def allow(): sys.exit(0)
def block(msg): sys.stderr.write(msg+"\n"); sys.exit(2)

def load_config(root):
    cfg=dict(DEFAULT_CFG); path=os.path.join(root,'project.config.yaml')
    if os.path.exists(path):
        try:
            import yaml
            data=yaml.safe_load(open(path)) or {}; db=data.get('database') or data.get('db') or {}
            cfg['policy']=db.get('change_policy', data.get('db_change_policy', cfg['policy']))
            for k in ('sensitive_tables','migration_dirs','forbidden_commands'):
                v=db.get(k, data.get(k))
                if v: cfg[k]=v
        except Exception:
            cfg.update({'config_error':True,'policy':'schema-direct','forbidden_commands':['db:push']})
    return cfg

def overridden(root, needle):
    if os.environ.get('PIPELINE_DB_OVERRIDE','').strip() not in ('','0','false','False'):
        return 'env PIPELINE_DB_OVERRIDE'
    for f in [os.path.join(root,'.ai-pipeline','approved-db-changes.txt'), os.path.join(root,'.claude','approved-db-changes.txt'), os.path.join(root,'.codex','approved-db-changes.txt')]:
        if os.path.exists(f):
            try:
                for line in open(f):
                    line=line.strip()
                    if line and not line.startswith('#') and line in needle: return f'{f} ({line})'
            except Exception: pass
    return None

def log_override(root, what, how):
    try:
        rd=os.path.join(root,'reports'); os.makedirs(rd,exist_ok=True)
        with open(os.path.join(rd,'db-guard-overrides.md'),'a') as fh:
            fh.write(f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n- override via {how}\n- allowed: {what[:300]}\n")
    except Exception: pass

PATCH_TEXT_KEYS=('command','patch','input','diff','content','text','changes')
def _patch_text(ti):
    """Codex apply_patch payload key is not standardised across versions; gather text from
    any plausible field (and fall back to every string value) so the guard cannot be
    silently bypassed by a payload-shape change."""
    parts=[ti[k] for k in PATCH_TEXT_KEYS if isinstance(ti.get(k),str) and ti[k]]
    if not parts: parts=[v for v in ti.values() if isinstance(v,str)]
    return '\n'.join(parts)
def patch_paths_and_text(tool, ti):
    if tool in ('Write','Edit'):
        fp=ti.get('file_path') or ti.get('path') or ''
        text=ti.get('content') if ti.get('content') is not None else (ti.get('new_string') or '')
        return ([fp] if fp else []), text
    if tool == 'apply_patch':
        cmd=_patch_text(ti)
        paths=[]
        for pat in (r"\*\*\* (?:Add|Update|Delete) File: ([^\n]+)", r"\+\+\+ b/([^\n]+)", r"--- a/([^\n]+)"):
            paths.extend(re.findall(pat, cmd))
        return list(dict.fromkeys(p.strip() for p in paths if p.strip())), cmd
    return [], ''

def path_under(path, d):
    d=d.strip('/'); p=path.strip('/')
    return bool(d and (p.startswith(d+'/') or ('/'+d+'/') in ('/'+p)))

def main():
    try: data=json.load(sys.stdin)
    except Exception: allow()
    root=data.get('cwd') or os.getcwd(); tool=data.get('tool_name',''); ti=data.get('tool_input') or {}
    cfg=load_config(root); policy=(cfg.get('policy') or '').lower().replace('_','-'); sens=[str(x).lower() for x in cfg.get('sensitive_tables',[])]
    if tool in ('Write','Edit','apply_patch'):
        paths,text=patch_paths_and_text(tool,ti); low=text.lower(); needle=' '.join(paths)+'\n'+text
        if policy=='schema-direct':
            for d in cfg.get('migration_dirs',[]):
                if any(path_under(p,d) for p in paths):
                    ov=overridden(root,needle)
                    if ov: log_override(root,needle,ov); allow()
                    block(f"BLOCKED (schema-direct mode): migration files are dormant; attempted path under '{d}/'. {HELP}")
        if any(p.endswith('.sql') for p in paths):
            destructive=(re.search(r"\bdrop\s+(table|database|schema|column|type|index)\b",low) or re.search(r"\btruncate\b",low) or re.search(r"\balter\s+table\b.*\bdrop\b",low))
            if destructive:
                ov=overridden(root,needle)
                if ov: log_override(root,needle,ov); allow()
                block(f"BLOCKED: destructive DDL inside SQL file/patch. {HELP}")
            has_verb=bool(re.search(r"\b(update|delete|insert|alter|drop|truncate)\b",low))
            if cfg.get('config_error') and has_verb:
                ov=overridden(root,needle)
                if ov: log_override(root,needle,ov); allow()
                block("BLOCKED (fail-closed): project.config.yaml exists but cannot be parsed; cannot verify DB policy. "+HELP)
            if has_verb and any(re.search(r"\b"+re.escape(t)+r"\b",low) for t in sens):
                ov=overridden(root,needle)
                if ov: log_override(root,needle,ov); allow()
                block(f"BLOCKED: SQL touches sensitive table(s) {', '.join(sens)}. {HELP}")
        allow()
    if tool=='Bash':
        cmd=ti.get('command','') or ''; low=cmd.lower()
        for bad in cfg.get('forbidden_commands',[]):
            if str(bad).lower() in low:
                ov=overridden(root,cmd)
                if ov: log_override(root,cmd,ov); allow()
                block(f"BLOCKED: `{bad}` is disabled under DB-change policy. {HELP}")
        destructive=(re.search(r"\bdrop\s+(table|database|schema|column|type|index)\b",low) or re.search(r"\btruncate\b",low) or re.search(r"\balter\s+table\b.*\bdrop\b",low))
        if destructive:
            ov=overridden(root,cmd)
            if ov: log_override(root,cmd,ov); allow()
            block(f"BLOCKED: destructive DDL detected. {HELP}")
        has_verb=bool(re.search(r"\b(update|delete|insert|alter|drop|truncate)\b",low)); looks_sql=any(k in low for k in ('psql','select','update','delete','insert','alter','drop','truncate','sql'))
        if cfg.get('config_error') and has_verb and looks_sql:
            ov=overridden(root,cmd)
            if ov: log_override(root,cmd,ov); allow()
            block("BLOCKED (fail-closed): project.config.yaml exists but cannot be parsed; DB policy unknown. "+HELP)
        if has_verb and looks_sql and any(re.search(r"\b"+re.escape(t)+r"\b",low) for t in sens):
            ov=overridden(root,cmd)
            if ov: log_override(root,cmd,ov); allow()
            block(f"BLOCKED: command appears to write to sensitive table(s) {', '.join(sens)}. {HELP}")
    allow()
if __name__=='__main__': main()
