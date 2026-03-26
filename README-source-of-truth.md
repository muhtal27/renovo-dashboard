# Renovo Source Of Truth

This repository is both the live `renovo-dashboard` app repo and the canonical source-of-truth workspace for Renovo material that belongs inside this codebase.

The repo root stays where it is. Do not relocate it into `03-engineering/` without an explicit migration plan, because that would risk breaking Next.js, backend paths, deployment settings, and local workflows.

## Operating Model

- Runtime code and runtime-served assets stay in the live app structure.
- Non-runtime source-of-truth material belongs in the canonical folders at the repo root.
- Uncertain items go to `00-inbox/`.
- Deprecated, replaced, or backup items go to `08-archive/`.
- If a file does not need to exist at the repo root for runtime or tooling reasons, it should not live loose at the root.

## Canonical Folders

- `00-inbox/`: Temporary holding area for unclear or unclassified files. Use this when ownership is uncertain.
- `01-product/`: Product requirements, feature specs, workflows, roadmaps, and decision records.
- `02-design/`: Wireframes, design references, screenshots, brand material, and non-runtime visual assets.
- `03-engineering/`: Engineering support material that is not part of runtime app structure, including standalone SQL, API contracts, architecture notes, and shared non-runtime engineering assets.
- `04-data/`: Sample cases, fixtures, imports, exports, CSVs, JSON datasets, and generated data artifacts.
- `05-ai/`: Prompts, schemas, evals, prompt notes, and AI-generated outputs.
- `06-operations/`: SOPs, checklists, claim templates, tenancy documents, and operating procedures.
- `07-admin/`: Planning, finance, contracts, invoices, budgets, and commercial admin material.
- `08-archive/`: Old drafts, deprecated material, replaced versions, and backups that should be retained but not treated as current.

## Runtime Folders

These folders are part of the live application and must stay stable unless there is a deliberate engineering reason to change them:

- `app/`: Next.js routes, pages, server actions, and app-level UI.
- `backend/`: FastAPI app, Alembic migrations, backend runtime code, and backend-local config files.
- `lib/`: Shared runtime helpers and app-supporting TypeScript modules.
- `public/`: Runtime-served web assets only. Do not move assets out of `public/` if code or metadata references them.
- `scripts/`: Developer scripts and lightweight repo utilities that support local work.
- `supabase/` and `tests/`: Preserve if present. They are runtime or development structure, not document storage.

## Placement Rules

- Product docs, specs, feature definitions, user flows, and decision records go in `01-product/`.
- Design screenshots, design references, mockups, and non-runtime visual inspiration go in `02-design/`.
- Standalone SQL, API contracts, architecture notes, and engineering support docs go in `03-engineering/`.
- CSVs, JSON data dumps, fixtures, imports, exports, and sample cases go in `04-data/`.
- Prompts, schemas, eval notes, and AI outputs go in `05-ai/`.
- SOPs, checklists, tenancy operations docs, and claim templates go in `06-operations/`.
- Planning, finance, and contracts go in `07-admin/`.
- Deprecated, replaced, duplicate, and backup material goes in `08-archive/`.
- If the correct placement is not clear, use `00-inbox/` and classify later.

## One-Off SQL Policy

- Alembic migrations belong only in `backend/alembic/versions/`.
- SQL that is not an Alembic migration belongs in `03-engineering/db/`.
- Do not leave one-off SQL scripts in the repo root.
- Do not store ad hoc SQL snippets in runtime folders unless they are part of backend runtime code or migration machinery.

## Prompt, Spec, And Output Policy

- Prompts belong in `05-ai/prompts/`.
- AI schemas belong in `05-ai/schemas/`.
- Eval notes and grading rubrics belong in `05-ai/evals/`.
- Generated AI responses, exports, or model-produced artifacts belong in `05-ai/outputs/`.
- Product specs belong in `01-product/requirements/` unless they are superseded, in which case archive them.
- Workflow definitions belong in `01-product/workflows/`.
- Decision records belong in `01-product/decisions/`.
- Generated exports and datasets belong in `04-data/exports/` or `04-data/imports/` as appropriate.

## Root-Level Cleanliness Rules

- Only these categories of items should remain loose at the repo root:
  - live runtime folders such as `app/`, `backend/`, `lib/`, `public/`, `scripts/`, `supabase/`, and `tests/`
  - canonical folders `00-inbox/` through `08-archive/`
  - required root config files used by the app or tooling
  - `README.md`
  - `README-source-of-truth.md`
  - `AGENTS.md`
- Do not leave screenshots, backup zips, prompts, notes, exports, SQL snippets, or planning docs at the root.
- Do not use the repo root as a staging area for temporary documents.

## Naming Conventions

- Prefer lowercase kebab-case names for files and folders.
- Use explicit, descriptive names that stand on their own.
- Prefix dated artifacts with `YYYYMMDD_` when time order matters.
- Avoid unstable suffixes like `final`, `new`, `latest`, or `v2` unless versioning is genuinely required.
- If a file is replaced by a better canonical version, archive the older one instead of renaming both ambiguously.

## Inbox Policy

- `00-inbox/` exists to prevent unsafe guesses.
- Put files in `00-inbox/` when classification is uncertain or when a move would otherwise be risky.
- Inbox items should be reviewed and moved into a canonical destination before they become dependencies for new work.
- `00-inbox/` is not a permanent storage location.

## Archive Policy

- Archive instead of deleting when a file is replaced, deprecated, duplicated, or risky to remove.
- Use the most specific archive bucket available:
  - `08-archive/old-drafts/`
  - `08-archive/deprecated/`
  - `08-archive/backups/`
- Keep enough filename clarity that the archive reason is understandable without opening the file.
- When the reason is not obvious, capture context in the commit message or adjacent documentation.

## Secrets And Stability Rules

- Do not inspect, rewrite, or normalize secret values in `.env*` files during governance work.
- Preserve git history and branch state.
- Prefer `git mv` when moving tracked files.
- Do not move runtime assets without first validating that they are not referenced.
- Treat `.next/`, `node_modules/`, `.vercel/`, `backend/.venv/`, `__pycache__/`, and similar generated directories as local tooling state, not source-of-truth storage.

## Guardrails

- Run `npm run governance:check` to detect unexpected loose root files and directories.
- The guardrail is advisory for local development. It prints placement suggestions rather than making changes automatically.
- Use the script before commits that add new documentation, exports, prompts, screenshots, or backup material.

## Quick Placement Guide

- Product spec or roadmap update: `01-product/`
- Screenshot or design reference not used by the live app: `02-design/`
- Standalone SQL or engineering contract: `03-engineering/`
- CSV, JSON export, fixture, import bundle: `04-data/`
- Prompt, schema, eval, model output: `05-ai/`
- SOP, checklist, claim template, tenancy process doc: `06-operations/`
- Planning, finance, contract, commercial doc: `07-admin/`
- Unsure where it goes: `00-inbox/`
- Replaced, deprecated, duplicate, or backup material: `08-archive/`

## Workspace Boundary

- No important Renovo files should live on Desktop, Downloads, or outside this workspace.
- New Renovo material created during work should be stored directly in the matching canonical folder.
