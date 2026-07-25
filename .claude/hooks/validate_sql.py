#!/usr/bin/env python3
"""PostToolUse advisory SQL check for changed .sql files.

Uses available tools in increasing strength:
- pg_format --check for formatting;
- sqlfluff lint for dialect-aware linting;
- psql parse inside a rolled-back transaction when PIPELINE_SQL_PARSE_DSN or DATABASE_URL is set.

Non-blocking: prints warnings and appends reports/sql-check-report.md.
"""
import sys, json, subprocess, os, re, shutil
from datetime import datetime


def read_input():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def changed_paths(root, tool, ti):
    paths = []
    if tool in ("Write", "Edit"):
        p = ti.get("file_path") or ti.get("path") or ""
        if p:
            paths.append(p)
    elif tool == "apply_patch":
        cmd = "\n".join(str(v) for v in ti.values() if isinstance(v, str))
        for pat in (r"\*\*\* (?:Add|Update|Delete) File: ([^\n]+)", r"\+\+\+ b/([^\n]+)", r"--- a/([^\n]+)"):
            paths.extend(re.findall(pat, cmd))
    if not paths:
        try:
            out = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True, cwd=root, timeout=5)
            paths = out.stdout.splitlines()
        except Exception:
            paths = []
    return list(dict.fromkeys(p for p in paths if p.endswith(".sql")))


def run_check(label, cmd, root, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=root, timeout=timeout)
        if r.returncode != 0:
            return label, (r.stderr or r.stdout or "").strip()[:2000]
    except FileNotFoundError:
        return None
    except Exception as exc:
        return label, f"check errored: {exc}"
    return None


def psql_parse(path, root):
    dsn = os.environ.get("PIPELINE_SQL_PARSE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn or not shutil.which("psql"):
        return None
    script = f"BEGIN;\n\\i {path}\nROLLBACK;\n"
    try:
        r = subprocess.run(
            ["psql", dsn, "--set", "ON_ERROR_STOP=1", "--quiet"],
            input=script,
            capture_output=True,
            text=True,
            cwd=root,
            timeout=30,
        )
        if r.returncode != 0:
            return "psql-parse", (r.stderr or r.stdout or "").strip()[:2000]
    except Exception as exc:
        return "psql-parse", f"check errored: {exc}"
    return None


def append_report(root, findings):
    if not findings:
        return
    try:
        rd = os.path.join(root, "reports")
        os.makedirs(rd, exist_ok=True)
        with open(os.path.join(rd, "sql-check-report.md"), "a") as f:
            f.write(f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            for path, label, msg in findings:
                f.write(f"### {path} — {label}\n{msg}\n")
    except Exception:
        pass


def main():
    data = read_input()
    tool = data.get("tool_name", "")
    ti = data.get("tool_input") or {}
    root = data.get("cwd") or os.getcwd()

    if tool not in ("Write", "Edit", "apply_patch"):
        sys.exit(0)

    findings = []
    for p in changed_paths(root, tool, ti):
        ap = p if os.path.isabs(p) else os.path.join(root, p)
        if not os.path.exists(ap):
            continue

        if shutil.which("pg_format"):
            result = run_check("pg_format", ["pg_format", "--check", ap], root, timeout=10)
            if result:
                findings.append((p, result[0], result[1]))

        if shutil.which("sqlfluff"):
            result = run_check("sqlfluff", ["sqlfluff", "lint", ap], root, timeout=30)
            if result:
                findings.append((p, result[0], result[1]))

        result = psql_parse(ap, root)
        if result:
            findings.append((p, result[0], result[1]))

    if findings:
        append_report(root, findings)
        print(f"⚠ SQL advisory findings → reports/sql-check-report.md")

    sys.exit(0)


if __name__ == "__main__":
    main()
