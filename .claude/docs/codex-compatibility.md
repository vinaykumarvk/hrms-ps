# Codex Compatibility Bundle

This repo now supports both Claude Code and OpenAI Codex.

## Why a separate Codex bundle exists

Claude Code reads global guidance from `~/.claude/CLAUDE.md`, skills from `~/.claude/skills`, and hooks from Claude settings.

Codex uses different discovery rules:

- instructions: `AGENTS.md` and `AGENTS.override.md`;
- skills: `.agents/skills` in the repo or `$HOME/.agents/skills` for user-wide skills;
- hooks: `.codex/hooks.json`, `.codex/config.toml`, `~/.codex/hooks.json`, or `~/.codex/config.toml`.

## Files added for Codex

| File / directory | Purpose |
|---|---|
| `AGENTS.md` | Codex-compatible global/project guidance. Mirrors the v8 `CLAUDE.md` principles but uses Codex-native `/plan`, `/goal`, `$skill` language. |
| `.codex/hooks.json` | Repo-local Codex hook configuration. |
| `.codex/hooks/*.py` | Thin wrappers that delegate to canonical hook implementations in `hooks/`. |
| `scripts/sync-to-codex.sh` | Copies skills and guidance into Codex-compatible locations. |
| `scripts/sync-from-codex.sh` | Pulls Codex skill edits back into the canonical `skills/` directory from repo-local or user-wide skill roots. |

## Skills

Codex skills use the same core format as the existing skill bundle: a directory containing `SKILL.md` with `name` and `description` frontmatter.

The canonical skill source remains:

```text
skills/<skill-name>/SKILL.md
```

To expose them to Codex, run:

```bash
scripts/sync-to-codex.sh
```

This syncs:

```text
skills/ -> ~/.agents/skills/
skills/ -> ~/.codex/skills/
skills/ -> .agents/skills/
AGENTS.md -> ~/.codex/AGENTS.md
```

Different Codex builds have used different user-wide skill roots, so the sync writes both `~/.agents/skills/` and `~/.codex/skills/`. Repo-local discovery uses `.agents/skills/`.

After that, restart Codex or start a new session and use `/skills` or type `$` to confirm the skills are available.

## Hooks

The canonical hook source remains:

```text
hooks/*.py
```

Codex repo-local wrappers live under:

```text
.codex/hooks/*.py
```

They delegate to the canonical hook scripts so there is no duplicated logic.

The hook config uses these Codex lifecycle events:

| Event | Hook |
|---|---|
| `PreToolUse` | DB-change guard and protected-value guard |
| `PostToolUse` | SQL advisory check and changed-file tests |
| `Stop` | lint/typecheck advisory check |

After syncing, run `/hooks` in Codex CLI to review and trust the hook definitions.

## Recommended setup commands

```bash
git pull
scripts/sync-to-codex.sh
codex --ask-for-approval never "Summarize the current instructions and list available AI Dev Pipeline skills."
```

Then inside Codex CLI:

```text
/hooks
/skills
```

Trust the repo-local hooks after reviewing them.

## Important note

Codex hooks are guardrails, not a perfect enforcement boundary. Codex documentation notes that `PreToolUse` can intercept Bash, `apply_patch`, and MCP calls, but it is still a guardrail rather than a complete enforcement boundary. Keep critical controls in contracts, tests, reviews, and CI as well.
