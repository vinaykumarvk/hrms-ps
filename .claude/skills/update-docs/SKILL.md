---
name: update-docs
description: Deep-analyze the entire project structure and update technical documentation (PROJECT_TECHNICAL_REFERENCE.md and PROJECT-OVERVIEW.md) with comprehensive, accurate details. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---
 
# Update Project Documentation
 
You are tasked with deeply analyzing the current project and producing **comprehensive, technically accurate** documentation updates.
 
## Target Files
 
Detect the project's existing technical documentation first (look in `docs/` and the repo root for a technical reference and an overview/onboarding doc, under any name). If found, update those files in place. If none exist and the user has not named targets, ask — or default to creating:
 
1. `docs/PROJECT_TECHNICAL_REFERENCE.md`
2. `docs/PROJECT-OVERVIEW.md`
 
These two names are a *default*, not an assumption about the project.
 
## Phase 1 — Deep Project Analysis
 
Before writing anything, perform a **thorough codebase analysis**. Do NOT skip any of these steps:
 
### 1.1 Project Structure
- Map the full directory tree (all folders, key files)
- Identify the monorepo/multi-package layout if any
- Note config files: `package.json`, `tsconfig.json`, `.env.example`, `docker-compose.yml`, `Makefile`, etc.
 
### 1.2 Tech Stack & Dependencies
- Read every `package.json` / `requirements.txt` / `pyproject.toml` / `Cargo.toml` (whatever applies)
- List all frameworks, libraries, and their versions
- Identify the runtime (Node, Python, .NET, etc.) and language (TypeScript, JavaScript, etc.)
- Note the build tooling (Vite, Webpack, esbuild, Turbopack, etc.)
 
### 1.3 Architecture & Patterns
- Identify the architectural pattern (MVC, Clean Architecture, Hexagonal, microservices, modular monolith, etc.)
- Trace the request lifecycle: entry point → routing → controllers/handlers → services → data layer → response
- Identify middleware, guards, interceptors, pipes, or equivalent
- Document the state management approach (if frontend exists)
 
### 1.4 Database & Data Layer
- Identify the database(s) used (Postgres, MySQL, MongoDB, Redis, etc.)
- Find the ORM / query builder (Prisma, TypeORM, Drizzle, Sequelize, SQLAlchemy, etc.)
- List all models/entities/schemas and their relationships
- Note migrations strategy and seed data
 
### 1.5 API Surface
- List all API routes/endpoints with HTTP methods
- Note authentication & authorization mechanisms (JWT, OAuth, session, API keys)
- Identify request validation approach (Zod, Joi, class-validator, etc.)
- Document any WebSocket, GraphQL, or gRPC endpoints
 
### 1.6 Frontend (if applicable)
- Identify framework (React, Next.js, Angular, Vue, Svelte, etc.)
- Map the page/route structure
- Note component library or design system in use
- Document state management (Redux, Zustand, Pinia, Context API, etc.)
 
### 1.7 DevOps & Infrastructure
- Docker setup (Dockerfiles, compose files)
- CI/CD configuration (GitHub Actions, GitLab CI, etc.)
- Environment variable documentation
- Deployment target (AWS, Vercel, Railway, self-hosted, etc.)
 
### 1.8 Testing
- Test framework(s) in use (Jest, Vitest, Pytest, Playwright, Cypress, etc.)
- Test file locations and naming conventions
- Coverage configuration if any
 
### 1.9 Key Business Logic
- Identify the core domain / business modules
- Document critical workflows and algorithms
- Note any background jobs, queues, cron tasks, or event-driven patterns
 
## Phase 2 — Write PROJECT_TECHNICAL_REFERENCE.md
 
Update `docs/PROJECT_TECHNICAL_REFERENCE.md` with **all findings** from Phase 1. Structure it as:
 
1. **Tech Stack Summary** — languages, frameworks, versions, runtimes
2. **Project Structure** — annotated directory tree
3. **Architecture Overview** — patterns, layers, data flow
4. **Database Schema** — models, relationships, migrations
5. **API Reference** — every endpoint, method, auth requirements
6. **Authentication & Authorization** — mechanisms, flows, role model
7. **Frontend Architecture** (if applicable) — routing, state, components
8. **Configuration & Environment** — all env vars with descriptions
9. **Build & Deployment** — build commands, Docker setup, CI/CD
10. **Testing Strategy** — frameworks, conventions, how to run
11. **Key Algorithms & Business Logic** — domain-critical code paths
12. **Third-Party Integrations** — external APIs, services, SDKs
 
## Phase 3 — Write PROJECT-OVERVIEW.md
 
Update `docs/PROJECT-OVERVIEW.md` as a **high-level but detailed** guide that helps a new developer understand the project. Structure it as:
 
1. **What is this project?** — purpose, problem it solves, target users
2. **High-Level Architecture** — system diagram description, major components
3. **Tech Stack at a Glance** — concise table of technologies
4. **Module Breakdown** — what each major module/package does
5. **Getting Started** — prerequisites, install, run, seed, test
6. **Development Workflow** — branching, PRs, code style, linting
7. **Key Concepts & Domain Terms** — glossary of domain-specific terminology
8. **Current Status & Roadmap** (if discernible from TODOs, issues, or comments)
 
## Documentation Authority Order
 
When two documents conflict, the higher-ranked one wins. Precedence, highest first:
 
1. **Governance/policy doc** (e.g. `CLAUDE.md` or the repo's top working-agreement file)
2. **Mechanically enforced contracts** — hooks, CI checks, and config that a machine actually acts on; where a hook enforces something a doc merely describes, the hook's behavior is the truth
3. **Baseline machine-readable contracts** (repo-wide)
4. **Feature-level contracts** (scoped to one feature or module)
5. **Architecture docs**
6. **Guidelines**
7. **READMEs and index/orientation docs** — orientation only; never cite these as evidence for anything load-bearing
 
When a lower-ranked doc contradicts a higher-ranked one or the live code, state the verified reality, cite the evidence, and flag the lower doc as stale — **never silently average the two**.
 
## Drift Control — Before Citing or Updating Any Doc
 
Run this checklist before quoting a document as evidence or editing it:
 
1. **Check for a known-drift register.** If the repo maintains one and the doc is listed, use the verified reality, not the doc.
2. **Check the doc's own header** for supersession notes ("Superseded by ...") before trusting its content.
3. **Spot-check its references.** Every path the doc names must exist:
 
```bash
# Extract backtick-quoted paths from a doc and test each
grep -oE '`[a-zA-Z0-9_./ -]+\.(md|ts|tsx|sql|yaml|yml|json|py|sh)`' <doc>.md \
  | tr -d '`' | sort -u | while read -r p; do [ -e "$p" ] || echo "MISSING: $p"; done
```
 
4. **Compare doc freshness vs. code freshness:**
 
```bash
git log -1 --format='%ad %h' -- <doc-path>
git log -1 --format='%ad %h' -- <code-path-it-describes>
# If the code is newer than the doc, treat every specific claim in the doc as suspect.
```
 
Doc-vs-code drift is the leading indicator of stale or hallucinated context — treat every stale doc as an input-poisoning risk for future readers. When you find new drift, do not repeat the stale claim anywhere: fix the doc in the same change, or record the drift with evidence (see the `failure-archaeology` skill for how drift and its causes get recorded).
 
## Writing Rules
 
- **Doc names must match file names.** If a doc, manifest, or report says "migration 116" or "FR-005", a file with exactly that name must exist. A citation that resolves to no file is the tell for hallucinated context.
- **Cite files by exact name from a live `ls` at write time.** Copy-paste the filename from command output; never type a filename, number, or ID from memory.
- **Verdict first.** Reports open with a `## Verdict` (or TL;DR) section near the top, followed by an **Evidence sources** section listing every file inspected, every table inspected, and every command run — a reader must be able to re-run the review.
- **Measured vs. assumed.** Every number is either measured (record the command that produced it) or explicitly labeled assumed/estimated. "Should work" is banned (see the `claims-discipline` skill).
- **WARN items carry an owner and a close-by date.** A WARN deferred without a named owner and a target date is an unprocessed WARN, not an accepted one.
- **Verify your own doc before finishing.** Run the reference spot-check from the drift-control protocol against the doc you just wrote (see the `verification-doctrine` skill).
 
## Rules
 
- **Be exhaustive** — every endpoint, every model, every config key matters.
- **Be accurate** — only document what you verify in the actual code. Do not hallucinate.
- **Use code references** — when describing a pattern, cite the actual file path.
- **Keep it readable** — use tables, code blocks, and clear headings.
- $ARGUMENTS
