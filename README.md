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

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Add the required app variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL=
NEXT_PUBLIC_SITE_URL=
EOT_API_BASE_URL=
EOT_TENANT_ID=
NEXT_PUBLIC_EOT_TENANT_ID=
```

`SUPABASE_SERVICE_ROLE_KEY` is only used by the New Business onboarding flow so it can look up existing Supabase Auth users by email before assigning dashboard or portal access.

4. Start the app:

```bash
npm run dev
```

5. Start the backend:

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

`EOT_API_BASE_URL` should point at the FastAPI service root, for example `http://127.0.0.1:8000`.
`EOT_TENANT_ID` is an optional fallback if the signed-in Supabase user does not already carry a
`tenant_id` or workspace identifier in auth metadata.

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

This repo is ready to deploy on Vercel as a standard Next.js app.

### Build settings

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output setting: default Next.js output

### Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for the New Business onboarding flow
- `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL`
- `NEXT_PUBLIC_SITE_URL` (optional override if you want metadata/canonical URLs pinned to a specific domain)
- `EOT_API_BASE_URL` so the Next.js proxy can forward `/api/eot/*` requests to the FastAPI service
- `EOT_TENANT_ID` if tenant resolution is not already stored in Supabase auth metadata

### Deployment checklist

1. Import the GitHub repo into Vercel.
2. Add the required frontend environment variables in Vercel Project Settings.
3. Separately deploy the Python backend and run Alembic migrations there.
4. Deploy.
5. Smoke test:
   - operator login
   - knowledge pages
   - waitlist/contact submission
   - backend health and migrations

## Handy Commands

```bash
npm run dev
npm run lint
npm run build
```

## Notes

- Public env vars are required at runtime. The app now fails fast with a clear error if Supabase env vars are missing.
- Outbound operator sending is disabled unless `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL` is configured.
