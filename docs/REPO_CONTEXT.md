# Repo Context

This file helps Verity/Codex understand how to work in this repository.

## What Verity detected
- Detected at: 2026-05-16 20:05:16 UTC
- Repo: aliiqbal208/ISO-Workflow-System
- Default branch: main

## Suggested commands (review before enabling automation)
These are written into `.verity/config.yml` (in a PR) if empty.

### Setup
- `cd frontend && npm ci`
- `cd backend && python -m pip install -r requirements.txt`

### Tests
_(none detected)_

### Build
- `cd frontend && npm run build`

### Deploy
_(none detected)_

## Notes for humans
- If you change commands here, also update `.verity/config.yml`.
- No secrets should be committed. Use GitHub Secrets.

## Auto Documentation Snapshot
<!-- verity:auto-doc:start -->
- Commit: `f2f225d701807fff37119a1a544badf6638a1b6e`
- Commit date: `2026-05-17T01:05:05+05:00`
- Repository: `aliiqbal208/ISO-Workflow-System`
- Default branch: `main`

### Configured Commands
Setup:
- `cd frontend && npm ci`
- `cd backend && python -m pip install -r requirements.txt`
Tests:
_(none configured)_
Build:
- `cd frontend && npm run build`
Deploy:
_(none configured)_

### Top-level Directories
- `backend`
- `docs`
- `frontend`
- `scripts`

### Workflow Files
- `codex-deploy.yml`
- `codex-dev-cycle.yml`
- `codex-pr-review.yml`
- `codex-test-generation.yml`
- `codex-test-to-issue.yml`
- `codex-usecase-generation.yml`
- `verity-auto-docs.yml`
- `verity-command-router.yml`
- `verity-guardrails.yml`
- `verity-monitor.yml`
- `verity-post-merge-validation.yml`
- `verity-pr-auto-fix.yml`
- `verity-repo-context-builder.yml`

### Enabled Policy Flags
- `- `openai_guardrail.enabled`: `True``
- `- `pr_review.enabled`: `True``
<!-- verity:auto-doc:end -->
