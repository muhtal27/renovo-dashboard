# Vercel Release Coordination

Renovo is deployed as two Vercel projects from the same Git repo:

- frontend: `renovo-dashboard` from the repo root
- backend: `renovo-backend` from `backend/`

Both projects can auto-deploy from Git, but they do so independently. That means a frontend deploy can go live before the backend alias has the API routes it expects, or a preview frontend can point at a stale backend. Treat them as one release unit whenever API contracts change.

Required Vercel dashboard setting:

- `renovo-dashboard` Root Directory: repo root
- `renovo-backend` Root Directory: `backend`

If `renovo-backend` is left at the repo root, Vercel reads the frontend `vercel.json` during Git deploys and can fail on frontend-only function rules.

## Current Contract

- Frontend and backend are one release unit for operator and EOT changes.
- Preview sign-off is only valid when the frontend preview is paired with the matching backend preview, or with an explicitly approved backend alias.
- Production promotion is only valid when the backend production deployment is healthy before or alongside the frontend production deployment.
- Smoke must run against the exact frontend/backend pair that will be signed off.

## Canonical Commands

```bash
npm run check:full
npm run deploy:preview:coordinated
npm run deploy:preview:coordinated:smoke
npm run deploy:prod:coordinated
npm run deploy:prod:coordinated:smoke
```

`deploy:preview:coordinated` does this:

1. deploys `backend/` to a preview URL
2. verifies `/api/v1/health` and `/api/v1/release` on that backend preview
3. deploys the frontend preview with `EOT_API_BASE_URL` pinned to that backend preview
4. prints the exact preview URL and smoke command to use

`deploy:prod:coordinated` does this:

1. deploys `backend/` to production
2. verifies the production backend alias
3. deploys the frontend to production with `EOT_API_BASE_URL` pinned to the backend production alias
4. prints the exact production smoke command

## Important Rules

- Do not treat an automatically generated Git preview as sign-off-ready unless it was created by the coordinated preview flow or explicitly verified against the intended backend URL.
- Do not treat a frontend production deploy as complete until backend compatibility has been verified and smoke has run against the live production pair.
- Keep the backend release metadata endpoint available at `/api/v1/release`. It is the operational compatibility marker used by the coordinated deploy scripts.
