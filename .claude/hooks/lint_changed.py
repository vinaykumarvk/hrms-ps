#!/usr/bin/env python3
"""Stop hook — lint/type-check changed files with a small cache.

Config-driven via project.config.yaml:
  commands.lint
  commands.typecheck

Non-blocking; appends findings to reports/lint-report.md.
"""
import sys, json, subprocess, os, shutil, hashlib
from datetime import datetime


def load_cfg(project_dir):
    cfg = {"lint": None, "typecheck": None}
    path = os.path.join(project_dir, "project.config.yaml")
    if os.path.exists(path):
        try:
            import yaml
            cmds = (yaml.safe_load(open(path)) or {}).get("commands") or {}
            cfg["lint"] = cmds.get("lint")
            cfg["typecheck"] = cmds.get("typecheck")
        except Exception:
            pass
    return cfg


def file_hash(project_dir, files):
    h = hashlib.sha256()
    for f in sorted(files):
        h.update(f.encode())
        ap = os.path.join(project_dir, f)
        if os.path.exists(ap) and os.path.isfile(ap):
            try:
                h.update(open(ap, "rb").read())
            except Exception:
                pass
    return h.hexdigest()


def load_cache(project_dir):
    path = os.path.join(project_dir, ".ai-pipeline", "lint-cache.json")
    try:
        return path, json.load(open(path))
    except Exception:
        return path, {}


def save_cache(path, cache):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        json.dump(cache, open(path, "w"), indent=2, sort_keys=True)
    except Exception:
        pass


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    project_dir = data.get("cwd") or os.getcwd()
    r = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True, cwd=project_dir)
    if r.returncode != 0:
        sys.exit(0)

    changed = [f for f in r.stdout.strip().split("\n") if f]
    if not changed:
        sys.exit(0)

    cfg = load_cfg(project_dir)
    cache_path, cache = load_cache(project_dir)
    digest = file_hash(project_dir, changed)

    commands = []
    if cfg["lint"]:
        commands.append(("lint", cfg["lint"], 120))
    if cfg["typecheck"]:
        commands.append(("typecheck", cfg["typecheck"], 240))

    if not commands:
        ts = [f for f in changed if f.endswith((".ts", ".tsx")) and os.path.exists(os.path.join(project_dir, f))]
        py = [f for f in changed if f.endswith(".py") and os.path.exists(os.path.join(project_dir, f))]
        if ts and shutil.which("npx"):
            commands.append(("ESLint", ["npx", "--no-install", "eslint", "--max-warnings=0"] + ts, 120))
        if py and shutil.which("ruff"):
            commands.append(("Ruff", ["ruff", "check"] + py, 60))

    violations = []

    def run(label, cmd, timeout):
        key = hashlib.sha256((label + "\n" + str(cmd) + "\n" + digest).encode()).hexdigest()
        if cache.get(key) == "pass":
            return
        try:
            res = subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True, cwd=project_dir, timeout=timeout)
            if res.returncode != 0 and (res.stdout or res.stderr):
                violations.append((label, (res.stdout or res.stderr)[:1500]))
                cache[key] = "fail"
            else:
                cache[key] = "pass"
        except Exception:
            pass

    for label, cmd, timeout in commands:
        run(label, cmd, timeout)

    save_cache(cache_path, cache)

    if violations:
        reports = os.path.join(project_dir, "reports")
        try:
            os.makedirs(reports, exist_ok=True)
            with open(os.path.join(reports, "lint-report.md"), "a") as f:
                f.write(f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                for label, out in violations:
                    f.write(f"### {label}\n{out}\n")
            print(f"⚠ {' + '.join(l for l, _ in violations)} issues → reports/lint-report.md")
        except Exception:
            pass

    sys.exit(0)


if __name__ == "__main__":
    main()
