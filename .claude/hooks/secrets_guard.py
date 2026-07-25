#!/usr/bin/env python3
"""PreToolUse guard for hardcoded secrets.

Supports Claude Write/Edit, Codex apply_patch, and git commit staged-diff scans.
Blocks common cloud, AI-provider, payment, database, JWT, and private-key leaks.
"""
import sys, json, os, re, subprocess
from datetime import datetime

PATS = [
    (r"AKIA[0-9A-Z]{16}", "AWS access key id"),
    (r"ASIA[0-9A-Z]{16}", "AWS temporary access key id"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----", "private key"),
    (r"(?i)\b(secret|token|api[_-]?key|password|passwd|client[_-]?secret)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]", "hardcoded credential"),
    (r"(?i)\bbearer\s+[A-Za-z0-9._\-]{20,}", "bearer token"),
    (r"xox[baprs]-[A-Za-z0-9-]{10,}", "Slack token"),
    (r"AIza[0-9A-Za-z_\-]{35}", "Google API key"),
    (r"sk_live_[0-9a-zA-Z]{16,}", "Stripe live key"),
    (r"sk_test_[0-9a-zA-Z]{16,}", "Stripe test key"),
    (r"ghp_[0-9A-Za-z]{36}", "GitHub token"),
    (r"github_pat_[0-9A-Za-z_]{20,}", "GitHub fine-grained token"),
    (r"sk-proj-[A-Za-z0-9_\-]{20,}", "OpenAI project key"),
    (r"sk-[A-Za-z0-9]{32,}", "OpenAI-style API key"),
    (r"sk-ant-[A-Za-z0-9_\-]{20,}", "Anthropic API key"),
    (r"sbp_[A-Za-z0-9_\-]{20,}", "Supabase personal access token"),
    (r"sb_secret_[A-Za-z0-9_\-]{20,}", "Supabase secret key"),
    (r"eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}", "JWT-like token"),
    (r"(?i)(postgres|postgresql|mysql|mongodb)://[^\s:'\"]+:[^\s@'\"]+@[^\s'\"]+", "database URL with credentials"),
    (r"\{\s*\"type\"\s*:\s*\"service_account\"[\s\S]{0,800}\"private_key\"\s*:", "Google service account JSON"),
]

ALLOW_SUFFIXES = (".example", ".sample", ".template", ".md", ".dist")


def allow():
    sys.exit(0)


def block(m):
    sys.stderr.write(m + "\n")
    sys.exit(2)


def overridden():
    return os.environ.get("PIPELINE_SECRETS_OVERRIDE", "").strip() not in ("", "0", "false", "False")


def log(root, what):
    try:
        rd = os.path.join(root, "reports")
        os.makedirs(rd, exist_ok=True)
        with open(os.path.join(rd, "secrets-guard-overrides.md"), "a") as f:
            f.write(f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n- allowed: {what[:200]}\n")
    except Exception:
        pass


def scan(txt):
    for pat, label in PATS:
        if re.search(pat, txt):
            return label
    return None


PATCH_TEXT_KEYS = ("command", "patch", "input", "diff", "content", "text", "changes")


def _patch_text(ti):
    """Gather text from plausible patch payload fields so a shape change cannot bypass the guard."""
    parts = [ti[k] for k in PATCH_TEXT_KEYS if isinstance(ti.get(k), str) and ti[k]]
    if not parts:
        parts = [v for v in ti.values() if isinstance(v, str)]
    return "\n".join(parts)


def patch_paths_text(ti):
    cmd = _patch_text(ti)
    paths = []
    for pat in (r"\*\*\* (?:Add|Update|Delete) File: ([^\n]+)", r"\+\+\+ b/([^\n]+)", r"--- a/([^\n]+)"):
        paths.extend(re.findall(pat, cmd))
    added = "\n".join(l[1:] for l in cmd.splitlines() if l.startswith("+") and not l.startswith("+++"))
    return paths, added


OV = "If false positive, set PIPELINE_SECRETS_OVERRIDE=1 for this run; it is logged."


def is_allowed_file(path):
    base = os.path.basename(path or "")
    return base.endswith(ALLOW_SUFFIXES)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        allow()

    root = data.get("cwd") or os.getcwd()
    tool = data.get("tool_name", "")
    ti = data.get("tool_input") or {}

    if tool in ("Write", "Edit", "apply_patch"):
        if tool == "apply_patch":
            paths, content = patch_paths_text(ti)
        else:
            p = ti.get("file_path") or ti.get("path") or ""
            paths = [p] if p else []
            content = ti.get("content") if ti.get("content") is not None else (ti.get("new_string") or "")

        for fp in paths or ["patch"]:
            base = os.path.basename(fp)
            if (base == ".env" or base.startswith(".env.")) and not base.endswith(ALLOW_SUFFIXES):
                if overridden():
                    log(root, fp)
                    allow()
                block(f"BLOCKED: writing '{base}' risks committing secrets. Use .env.example for names only. {OV}")

        if not all(is_allowed_file(p) for p in paths or []):
            hit = scan(content)
            if hit:
                if overridden():
                    log(root, hit)
                    allow()
                block(f"BLOCKED: possible {hit} in patch/write. Move it to environment config. {OV}")
        allow()

    if tool == "Bash":
        cmd = ti.get("command", "") or ""
        if re.search(r"git\s+add\b[^\n]*\.env(\b|\s|$)", cmd) or (re.search(r"git\s+commit\b", cmd) and ".env" in cmd):
            if overridden():
                log(root, cmd)
                allow()
            block(f"BLOCKED: looks like staging/committing a .env file. {OV}")

        if re.search(r"git\s+commit\b", cmd):
            try:
                diff = subprocess.run(
                    ["git", "diff", "--cached", "--unified=0"],
                    capture_output=True,
                    text=True,
                    cwd=root,
                    timeout=15,
                ).stdout
                added = "\n".join(l[1:] for l in diff.splitlines() if l.startswith("+") and not l.startswith("+++"))
                hit = scan(added)
                if hit:
                    if overridden():
                        log(root, hit)
                        allow()
                    block(f"BLOCKED: possible {hit} in staged diff. {OV}")
            except Exception:
                pass
    allow()


if __name__ == "__main__":
    main()
