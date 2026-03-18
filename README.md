# Renovo Dashboard

Renovo is a Next.js operator dashboard backed by Supabase. It now includes:

- Operator workspace for calls, cases, knowledge, and records
- Role-based login routing
- Tenant portal
- Landlord portal
- Contractor portal

## Stack

- Next.js 16
- React 19
- Supabase client auth + realtime
- SQL migrations in `supabase/migrations`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Add the required public app variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL=
```

4. Start the app:

```bash
npm run dev
```

## SQL And Migrations

Portal and knowledge changes are tracked in `supabase/migrations`.

Important recent migrations include:

- `20260318_add_portal_profiles.sql`
- `20260318_add_portal_rls.sql`
- `20260318_add_tenant_portal_actions.sql`
- `20260318_add_landlord_portal_actions.sql`
- `20260318_add_scotland_knowledge_base.sql`

If you are deploying a fresh environment, make sure those migrations have been run in Supabase before testing the portals.

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
- `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL`

### Deployment checklist

1. Import the GitHub repo into Vercel.
2. Add the three required environment variables in Vercel Project Settings.
3. Confirm the Supabase SQL migrations have already been applied in the target project.
4. Deploy.
5. Smoke test:
   - operator login
   - portal login routing
   - tenant self-service actions
   - landlord self-service actions
   - outbound operator sending

## Handy Commands

```bash
npm run dev
npm run lint
npm run build
```

Optional local SQL runner:

```bash
npm run sql -- "select now();"
```

The SQL runner expects one of:

- `SUPABASE_DB_URL`
- `DATABASE_URL`
- `POSTGRES_URL`

## Notes

- Public env vars are required at runtime. The app now fails fast with a clear error if Supabase env vars are missing.
- Outbound operator sending is disabled unless `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL` is configured.
