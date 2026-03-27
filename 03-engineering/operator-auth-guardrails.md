# Operator Auth Guardrails

Use this as the source of truth before changing operator auth, route protection, session handling, or the EOT proxy path.

## Protected Operator Routes

Canonical matcher:
[lib/operator-route-protection.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-route-protection.ts)

Protected page families:
- `/overview`
- `/eot` and `/eot/*`
- `/tenancy`
- `/disputes`
- `/recommendations`
- `/claims`
- `/reports`
- `/calls`
- `/knowledge`
- `/settings`

Rules:
- New operator page routes must be added to the canonical matcher before shipping.
- Middleware uses this matcher through [proxy.ts](/Users/retailltd/Code/renovo-dashboard/proxy.ts).
- Route matcher regressions are covered by [tests/operator-route-protection.test.ts](/Users/retailltd/Code/renovo-dashboard/tests/operator-route-protection.test.ts).

## Session Handling

Read-only server-render path:
[lib/operator-session-server.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-session-server.ts)
`readOperatorSessionIfNeeded()`

Cookie-mutating path:
[lib/operator-session-server.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-session-server.ts)
`refreshOperatorSessionIfNeeded()`

Rules:
- Server components and layouts must stay on the read-only path.
- Cookie mutation and session persistence are only allowed in route handlers or server actions.
- Do not call the cookie-mutating refresh path from server render code.

Why:
- Next.js rejects cookie writes during render.
- This is the class of bug that caused the `/reports` failure when a server-render path tried to refresh and persist the operator session.

## Middleware vs Route Handlers

Middleware boundary:
[proxy.ts](/Users/retailltd/Code/renovo-dashboard/proxy.ts)

Rules:
- Middleware protects operator page routes.
- Middleware also applies `noindex` headers for protected pages and `/api/*`.
- `/api/eot/*` is intentionally protected in route handlers, not middleware.
- Keep EOT protection in [lib/eot-proxy.ts](/Users/retailltd/Code/renovo-dashboard/lib/eot-proxy.ts) plus the backend auth layer. Do not replace it with a weaker client-trust model.

## Membership-Backed Auth

Membership resolution and permission checks:
[lib/operator-server.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-server.ts)
[lib/operator-membership-server.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-membership-server.ts)

Rules:
- Access requires a valid auth session.
- Access also requires an active tenant membership.
- Role and permission checks come from the resolved membership, not from client-provided input.
- Operator roles are membership-backed and enforced server-side.

## EOT Internal Auth

Frontend signing:
[lib/eot-server.ts](/Users/retailltd/Code/renovo-dashboard/lib/eot-server.ts)

Frontend proxy:
[lib/eot-proxy.ts](/Users/retailltd/Code/renovo-dashboard/lib/eot-proxy.ts)

Backend verification:
[backend/app/api/eot/auth.py](/Users/retailltd/Code/renovo-dashboard/backend/app/api/eot/auth.py)

Rules:
- The frontend signs trusted internal `/api/eot/*` requests before forwarding them to FastAPI.
- Frontend and backend `EOT_INTERNAL_AUTH_SECRET` must match exactly.
- Missing or mismatched EOT env breaks `/api/eot/*`, including `/api/eot/cases` and the reports portfolio path.
- Do not bypass trusted internal auth to make local, preview, or production flows “just work”.

## Environment Parity

Local env examples and validation:
[.env.local.example](/Users/retailltd/Code/renovo-dashboard/.env.local.example)
[backend/.env.example](/Users/retailltd/Code/renovo-dashboard/backend/.env.example)
[.env.playwright.example](/Users/retailltd/Code/renovo-dashboard/.env.playwright.example)
[scripts/validate-local-env.mjs](/Users/retailltd/Code/renovo-dashboard/scripts/validate-local-env.mjs)

Release guardrails:
[.github/workflows/release-guardrails.yml](/Users/retailltd/Code/renovo-dashboard/.github/workflows/release-guardrails.yml)

Smoke coverage:
[tests/smoke/auth.spec.ts](/Users/retailltd/Code/renovo-dashboard/tests/smoke/auth.spec.ts)
[tests/smoke/operator-routes.spec.ts](/Users/retailltd/Code/renovo-dashboard/tests/smoke/operator-routes.spec.ts)
[tests/smoke/eot-api.spec.ts](/Users/retailltd/Code/renovo-dashboard/tests/smoke/eot-api.spec.ts)

Rules:
- Preview must have EOT env parity before it is used for release sign-off.
- Local, preview, and production all need the same EOT trust contract:
  frontend `EOT_INTERNAL_AUTH_SECRET` matches backend `EOT_INTERNAL_AUTH_SECRET`, and the frontend points at the correct `EOT_API_BASE_URL`.
- `npm run check:full` is the pre-deploy guardrail.

## Before You Ship

- New operator routes are added to [lib/operator-route-protection.ts](/Users/retailltd/Code/renovo-dashboard/lib/operator-route-protection.ts).
- Target env has the required frontend and backend EOT vars.
- `npm run check:full`
- Preview deploy
- Preview smoke run if applicable
- Quick manual browser pass across login, reports, EOT, knowledge, and settings
- Post-deploy log check for new 500s
