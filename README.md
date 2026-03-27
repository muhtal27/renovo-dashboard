# Renovo Dashboard

Renovo is a Next.js frontend plus a clean-slate Python backend for end-of-tenancy automation.

- Marketing and operator-facing frontend in `app/`
- Clean FastAPI + SQLAlchemy + Alembic backend in `backend/`
- Role-based login routing
- Supabase for auth, storage, and PostgreSQL

## Stack

- Next.js 16
- React 19
- Supabase client auth + realtime
- FastAPI, SQLAlchemy 2.0, Alembic, and pgvector in `backend/`

## Automated Local Commands

```bash
npm run bootstrap:local
npm run check:env:local
npm run check
npm run check:full
npm run dev:local
npm run smoke:local
```

These commands automate local file creation, env validation, frontend startup, backend startup, and local smoke execution.

Operator auth and route-protection rules live in
[03-engineering/operator-auth-guardrails.md](03-engineering/operator-auth-guardrails.md).

Two-project Vercel release coordination lives in
[03-engineering/vercel-release-coordination.md](03-engineering/vercel-release-coordination.md).

Secrets that still require a real value if automation cannot source them:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EOT_INTERNAL_AUTH_SECRET`
- `DATABASE_URL`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

Optional safe helper:

```bash
npm run pull:env:vercel
```

That can pull Vercel-linked env into `.env.local` and `backend/.env` when those files do not already exist. It does not fill `.env.playwright`.

## Release Guardrail

Run this before any deploy:

```bash
npm run check:full
```

Release order:

1. `npm run check:full`
2. `npm run deploy:preview:coordinated`
3. run smoke against the coordinated preview pair:
   `npm run deploy:preview:coordinated:smoke`
4. do a brief manual browser pass
5. `npm run deploy:prod:coordinated`
6. run smoke against production:
   `npm run deploy:prod:coordinated:smoke`
7. inspect logs for new 500s

Do not sign off a Git-generated preview unless it is explicitly paired with the backend instance you intend to ship.

CI always runs `npm run check` plus the protected-route matcher regression test. CI smoke runs when these GitHub secrets are present:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EOT_INTERNAL_AUTH_SECRET`
- `DATABASE_URL`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env files from the tracked examples:

```bash
cp .env.local.example .env.local
cp backend/.env.example backend/.env
cp .env.playwright.example .env.playwright
```

3. Fill in the frontend runtime env in `.env.local`.

Required for local operator login, session resolution, and protected routes:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Required for the local `/api/eot/*` proxy path:

```bash
EOT_INTERNAL_AUTH_SECRET=
EOT_API_BASE_URL=http://127.0.0.1:8000
```

`EOT_INTERNAL_AUTH_SECRET` must exactly match the backend value in `backend/.env`.

Optional frontend env:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL=
NEXT_PUBLIC_DASHBOARD_SIGN_IN_URL=http://localhost:3000/login
EOT_TENANT_ID=
NEXT_PUBLIC_EOT_TENANT_ID=
```

4. Fill in the backend runtime env in `backend/.env`.

Required for the backend to boot and serve `/api/eot/*`:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/renovo
EOT_INTERNAL_AUTH_SECRET=
```

Optional backend env:

```bash
APP_ENV=local
DEBUG=true
PROJECT_NAME=Renovo Backend
API_V1_PREFIX=/api/v1
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_INSPECTIONS=inspection-files
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET_INSPECTIONS` are only needed for Supabase-backed admin/storage flows. They are not required for `/api/eot/cases` or the reports portfolio.

5. Start the frontend:

```bash
npm run dev
```

The Next.js app reads `.env.local`. It does not read `.env.playwright`.

6. Start the backend:

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

7. Run smoke tests:

```bash
npm run smoke:local
```

`.env.playwright` is only for the Playwright runner and login bootstrap. The app under test still uses `.env.local`.

If you want to target an existing preview or production deployment instead of local dev, set `PLAYWRIGHT_BASE_URL` in `.env.playwright` to that deployed URL.

## Local EOT Troubleshooting

- `Missing EOT_INTERNAL_AUTH_SECRET in the Next.js runtime environment...`
  The frontend `.env.local` is missing `EOT_INTERNAL_AUTH_SECRET`.
- `Unable to reach the EOT backend at http://127.0.0.1:8000...`
  The frontend proxy is using the local default backend URL because `EOT_API_BASE_URL` is unset and the backend is not reachable there.
- `EOT internal authentication is not configured on the backend...`
  The backend `backend/.env` is missing `EOT_INTERNAL_AUTH_SECRET`.
- `Trusted operator context is invalid.`
  The frontend and backend `EOT_INTERNAL_AUTH_SECRET` values do not match.

`EOT_TENANT_ID` is an optional fallback if the signed-in Supabase user does not already carry a `tenant_id` or workspace identifier in auth metadata.

## Local Auth Bootstrap

If you need a deterministic local operator account, add `SUPABASE_SERVICE_ROLE_KEY` to
`.env.local` and run:

```bash
node scripts/bootstrap-local-auth.mjs
```

Defaults created or updated by the script:

- email: `local-operator@renovo.dev`
- password: `RenovoLocal123!`
- tenant id: `019d2215-620d-77c3-aa71-c0b5d517e9f8`

Override any value if needed:

```bash
node scripts/bootstrap-local-auth.mjs --email you@example.com --password 'YourPassword123!' --tenant-id 019d2215-620d-77c3-aa71-c0b5d517e9f8
```

## Database And Migrations

Application schema is managed only through Alembic migrations in `backend/alembic/versions`.

- Do not create app schema manually in the Supabase dashboard.
- Do not use legacy SQL files or remote schema dumps.
- Every schema change should be a new Alembic revision.

## Vercel Deployment

This repo deploys to two linked Vercel projects from the same GitHub repository:

- `renovo-dashboard` from the repo root
- `renovo-backend` from `backend/`

Required Vercel Root Directory settings:

- `renovo-dashboard`: repo root
- `renovo-backend`: `backend`

Both can auto-deploy from pushes to `main`, but they are still independent deployments. That is not enough protection when frontend code depends on new backend routes.

Use the coordinated commands for release work:

```bash
npm run deploy:preview:coordinated
npm run deploy:preview:coordinated:smoke
npm run deploy:prod:coordinated
npm run deploy:prod:coordinated:smoke
```

The preview command pins the frontend preview to the matching backend preview using a runtime `EOT_API_BASE_URL` override. The production command deploys the backend first, verifies the backend alias, then deploys the frontend against that production backend alias.

### Build settings

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output setting: default Next.js output

### Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for operator membership/profile resolution and the New Business onboarding flow
- `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL`
- `NEXT_PUBLIC_SITE_URL` (optional override if you want metadata/canonical URLs pinned to a specific domain)
- `EOT_INTERNAL_AUTH_SECRET` so the Next.js proxy can sign trusted `/api/eot/*` requests
- `EOT_API_BASE_URL` so the Next.js proxy can forward `/api/eot/*` requests to the FastAPI service
- `EOT_TENANT_ID` if tenant resolution is not already stored in Supabase auth metadata

### Deployment checklist

1. Import the GitHub repo into Vercel.
2. Link both the repo root and `backend/` to their Vercel projects.
3. Add the required frontend environment variables in `renovo-dashboard`.
4. Add backend runtime variables and database access in `renovo-backend`.
5. Run `npm run check:full`.
6. Use the coordinated preview and production deploy commands above.
7. Smoke the exact frontend/backend pair that will be signed off.

## Handy Commands

```bash
npm run dev
npm run lint
npm run build
```

## Notes

- Public env vars are required at runtime. The app now fails fast with a clear error if Supabase env vars are missing.
- Outbound operator sending is disabled unless `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL` is configured.
