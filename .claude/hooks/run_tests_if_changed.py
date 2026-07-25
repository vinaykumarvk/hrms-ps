#!/usr/bin/env python3
"""PostToolUse advisory test hook.

Runs project tests when source files changed. Non-blocking.

Config in project.config.yaml:
  commands.test: npm test
  commands.test_smoke: npm run test:smoke
  commands.test_touched: npm run test:touched -- {files}
  test_hook.mode: smoke | touched | full | off
  source.globs: [src/, apps/*/src/]

Default mode is touched when a touched command exists, otherwise smoke/full fallback.
"""
import sys, json, subprocess, os, shlex
from datetime import datetime


def load_cfg(project_dir):
    cfg = {
        "test_cmd": None,
        "smoke_cmd": None,
        "touched_cmd": None,
        "mode": "touched",
        "src_globs": ["src/", "apps/*/src/", "packages/*/src/", "app/", "lib/", "internal/"],
    }
    path = os.path.join(project_dir, "project.config.yaml")
    if os.path.exists(path):
        try:
            import yaml
            data = yaml.safe_load(open(path)) or {}
            cmds = data.get("commands") or {}
            cfg["test_cmd"] = cmds.get("test")
            cfg["smoke_cmd"] = cmds.get("test_smoke")
            cfg["touched_cmd"] = cmds.get("test_touched")
            cfg["mode"] = ((data.get("test_hook") or {}).get("mode") or cfg["mode"]).lower()
            sp = (data.get("source") or {}).get("globs")
            if sp:
                cfg["src_globs"] = sp
        except Exception:
            pass
    return cfg


def is_src(p, globs):
    p = p.replace("\\", "/")
    for g in globs:
        g = g.rstrip("/")
        if "*" not in g:
            if p.startswith(g + "/") or p == g:
                return True
        else:
            parts = g.split("/")
            pp = p.split("/")
            if len(pp) >= len(parts) and all(seg == "*" or seg == pp[i] for i, seg in enumerate(parts)):
                return True
    return False


def npm_fallback(project_dir):
    pkg = os.path.join(project_dir, "package.json")
    if not os.path.exists(pkg):
        return None
    try:
        scripts = (json.load(open(pkg)).get("scripts") or {})
    except Exception:
        return None
    ts = scripts.get("test", "")
    if not ts or "no test specified" in ts.lower():
        return None
    return "npm test --silent -- --passWithNoTests"


def choose_command(cfg, changed_src, project_dir):
    mode = cfg["mode"]
    if mode == "off":
        return None, "off"
    if mode == "smoke" and cfg["smoke_cmd"]:
        return cfg["smoke_cmd"], "smoke"
    if mode == "touched" and cfg["touched_cmd"]:
        quoted = " ".join(shlex.quote(f) for f in changed_src)
        return cfg["touched_cmd"].replace("{files}", quoted), "touched"
    if mode == "full" and cfg["test_cmd"]:
        return cfg["test_cmd"], "full"

    # Fallback chain.
    if cfg["touched_cmd"]:
        quoted = " ".join(shlex.quote(f) for f in changed_src)
        return cfg["touched_cmd"].replace("{files}", quoted), "touched"
    if cfg["smoke_cmd"]:
        return cfg["smoke_cmd"], "smoke"
    if cfg["test_cmd"]:
        return cfg["test_cmd"], "full"
    return npm_fallback(project_dir), "npm-fallback"


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    project_dir = data.get("cwd") or os.getcwd()
    if subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], capture_output=True, text=True, cwd=project_dir).returncode != 0:
        sys.exit(0)

    cfg = load_cfg(project_dir)
    changed = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True, cwd=project_dir).stdout.split("\n")
    changed_src = [f for f in changed if f and is_src(f, cfg["src_globs"])]
    if not changed_src:
        sys.exit(0)

    test_cmd, mode = choose_command(cfg, changed_src, project_dir)
    if not test_cmd:
        sys.exit(0)

    r = subprocess.run(test_cmd, shell=True, capture_output=True, text=True, cwd=project_dir, timeout=180)
    reports = os.path.join(project_dir, "reports")
    try:
        os.makedirs(reports, exist_ok=True)
        status = "PASS" if r.returncode == 0 else "FAIL"
        with open(os.path.join(reports, "test-results.md"), "a") as f:
            f.write(f"\n## {status} — {datetime.now().strftime('%Y-%m-%d %H:%M')}  ({mode}: `{test_cmd}`)\n")
            f.write("Changed source files:\n")
            for src in changed_src[:50]:
                f.write(f"- {src}\n")
            tail = (r.stdout or "")[-1200:]
            if r.returncode != 0:
                tail += "\n" + (r.stderr or "")[-600:]
            f.write("\n" + tail + "\n")
        if r.returncode != 0:
            print(f"⚠ Tests {status} → reports/test-results.md")
    except Exception:
        pass

    sys.exit(0)


if __name__ == "__main__":
    main()
