# Vercel Release Coordination

Renovo now ships from two separate Git repos and two separate Vercel projects:

- frontend repo/project: `renovo-dashboard`
- backend repo/project: `renovo-backend`

That split removes the old shared-repo deployment coupling, but frontend/backend compatibility still matters whenever API contracts change. This repo's deploy helper only deploys the frontend project. If you need a matched backend for preview or production sign-off, pass the backend URL in explicitly.

## Current Contract

- Frontend and backend remain one release unit for operator and EOT changes, even though they now deploy from separate repos.
- Preview sign-off is only valid when the frontend preview is paired with the intended backend preview, or with an explicitly approved backend alias.
- Production promotion is only valid when the backend production deployment is healthy before or alongside the frontend production deployment.
- Smoke must run against the exact frontend/backend pair that will be signed off.

## Canonical Commands

```bash
npm run check:full
npm run deploy:preview
npm run deploy:preview:smoke
npm run deploy:prod
npm run deploy:prod:smoke
```

`deploy:preview` does this:

1. optionally verifies a separately deployed backend preview if `RENOVO_BACKEND_PREVIEW_URL` or `--backend-url` is provided
2. deploys the frontend preview from this repo
3. pins `EOT_API_BASE_URL` only when an explicit backend URL override is provided
4. prints the exact preview URL and smoke command to use

`deploy:prod` does this:

1. verifies the production backend alias, defaulting to `RENOVO_BACKEND_PRODUCTION_URL` or `https://renovo-backend.vercel.app`
2. deploys the frontend to production from this repo
3. pins `EOT_API_BASE_URL` to that backend production alias for the deployment
4. prints the exact production smoke command

## Important Rules

- Do not treat an automatically generated Git preview as sign-off-ready unless it was deployed with the intended backend URL or explicitly verified against the intended backend URL.
- Do not treat a frontend production deploy as complete until backend compatibility has been verified and smoke has run against the live production pair.
- Keep the backend release metadata endpoint available at `/api/v1/release`. It is the operational compatibility marker used by the frontend deploy helper in this repo.
