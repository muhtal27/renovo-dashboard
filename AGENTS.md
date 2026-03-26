# AGENTS

## Workspace Summary

- This workspace is the live `renovo-dashboard` repository and the Renovo source-of-truth workspace.
- Runtime engineering lives in `app/`, `backend/`, `lib/`, `public/`, `scripts/`, and root config files.
- Non-runtime source-of-truth material belongs in the canonical folders `00-inbox/` through `08-archive/`.
- The repo root is not a dumping ground. If a file is not required at the root for runtime or tooling reasons, place it elsewhere.

## Agent Rules

- Do not create loose non-runtime files at the repo root.
- Place prompts, schemas, evals, and AI outputs in `05-ai/`.
- Place specs, workflows, roadmaps, and decision records in `01-product/`.
- Place screenshots and design references that are not runtime-served assets in `02-design/`.
- Place standalone SQL, API contracts, and engineering support docs in `03-engineering/`.
- Place imports, exports, fixtures, and sample data in `04-data/`.
- Place SOPs, checklists, claim templates, and tenancy docs in `06-operations/`.
- Place planning, finance, and contract material in `07-admin/`.
- Use `00-inbox/` when the correct destination is uncertain.
- Use `08-archive/` for deprecated, replaced, duplicate, or backup material.

## Runtime Safety

- Do not move or rename runtime assets in `public/` unless you have explicitly validated every reference that depends on them.
- Do not refactor runtime code just to satisfy organization goals.
- Do not relocate the repo root.
- Preserve `app/`, `backend/`, `lib/`, `public/`, `scripts/`, `supabase/`, `tests/`, root configs, and `.env*` unless there is a deliberate, justified reason.

## Secrets And Local State

- Do not inspect, rewrite, or expose secret values from `.env*` files.
- Do not treat `.next/`, `node_modules/`, `.vercel/`, `backend/.venv/`, or generated caches as document storage.
- Ignore generated local state unless the task is explicitly about cleanup or tooling hygiene.

## Governance Workflow

- Before introducing a new non-runtime file, decide its canonical home first.
- When adding loose docs or exports, prefer a safe move into the canonical structure over leaving them near the code that produced them.
- If a file seems important but ownership is unclear, put it in `00-inbox/` and explain the ambiguity.
- If a file is superseded but should be retained, move it to `08-archive/` instead of deleting it.
- Run `npm run governance:check` after organization work or before commits that add documents, screenshots, exports, prompts, or backups.

## Naming Expectations

- Prefer lowercase kebab-case names.
- Use dated prefixes like `YYYYMMDD_` when chronology matters.
- Avoid ambiguous suffixes such as `final`, `new`, and `latest`.
