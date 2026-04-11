# Public API v1

## API Principles

1. **REST over HTTP/1.1** — JSON request/response bodies
2. **Versioned via URL path** — `/v1/` prefix; breaking changes require `/v2/`
3. **Snake_case everywhere** — field names, query params, error codes
4. **UTC timestamps** — ISO 8601 format: `2026-04-11T14:30:00Z`
5. **Idempotent writes** — clients can safely retry with `Idempotency-Key` header
6. **Minimal envelope** — success returns data directly; errors return structured error object

## Auth Model

### Production: OAuth 2.0 Client Credentials

Partners register an application and receive:
- `client_id` (public, used in requests)
- `client_secret` (private, stored securely by partner)

Token exchange:
```
POST /v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=app_xxx&client_secret=sec_xxx&scope=inventory:write cases:read
```

Response:
```json
{
  "access_token": "renv1_live_...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "inventory:write cases:read"
}
```

Tokens are JWT signed by Renovo, containing:
```json
{
  "sub": "app_xxx",
  "tenant_id": "uuid",
  "scopes": ["inventory:write", "cases:read"],
  "exp": 1712847600
}
```

### Sandbox: API Keys

For development and testing, partners use long-lived API keys:
```
Authorization: Bearer renv1_test_sk_...
```

API keys are scoped to a specific tenant and set of permissions. They don't expire but can be rotated.

### Scopes

| Scope | Description |
|-------|-------------|
| `inventory:write` | Push inventory/inspection data |
| `inventory:read` | Read inspection records |
| `cases:read` | Read case status and details |
| `cases:write` | Update case data (rare — for specific integrations) |
| `webhooks:manage` | Register/manage webhook subscriptions |
| `documents:write` | Push documents (check-in reports, etc.) |
| `documents:read` | Read case documents |

## Versioning

- URL-based: `/v1/inspections`, `/v1/cases/{id}`
- Non-breaking additions (new fields, new optional params) don't require version bump
- Breaking changes (field removal, type change, behavior change) require new version
- Previous version supported for 12 months after deprecation announcement

## Error Format

All errors return:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Human-readable explanation",
    "details": [
      {
        "field": "property_address.postcode",
        "issue": "required",
        "message": "Postcode is required"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

Standard error codes:
| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `validation_error` | Request body/params invalid |
| 401 | `unauthorized` | Missing or invalid auth |
| 403 | `forbidden` | Valid auth but insufficient scope |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Idempotency key reuse with different payload |
| 422 | `unprocessable` | Valid syntax but business rule violation |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Unexpected server error |

## Pagination Format

Cursor-based for list endpoints:
```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "total_count": 47
  }
}
```

Query params: `?cursor=eyJ...&limit=50` (default limit: 20, max: 100)

## Rate Limiting Model

| Tier | Requests/minute | Burst |
|------|----------------|-------|
| Sandbox | 60 | 10 |
| Production (default) | 300 | 50 |
| Production (enterprise) | 1000 | 100 |

Rate limit headers on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1712847600
```

On 429:
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 12 seconds.",
    "retry_after": 12
  }
}
```

## Idempotent Write Behavior

All POST/PUT/PATCH endpoints accept:
```
Idempotency-Key: partner-generated-unique-key
```

Behavior:
- First request: processed normally, response cached for 24h
- Duplicate request (same key, same payload): return cached response (200, not re-processed)
- Duplicate request (same key, different payload): return 409 Conflict
- No key provided: request processed without idempotency protection

## Webhook Registration Model

Partners register webhook endpoints to receive events from Renovo:

```
POST /v1/webhooks
Authorization: Bearer renv1_live_...
{
  "url": "https://partner.example.com/webhooks/renovo",
  "events": ["case.status_changed", "case.document_generated"],
  "secret": "whsec_partner_generated_secret"
}
```

Response:
```json
{
  "id": "wh_abc123",
  "url": "https://partner.example.com/webhooks/renovo",
  "events": ["case.status_changed", "case.document_generated"],
  "status": "active",
  "created_at": "2026-04-11T14:30:00Z"
}
```

## Webhook Signature Model

Outbound webhooks are signed using HMAC-SHA256:

```
X-Renovo-Signature: sha256=abc123...
X-Renovo-Event: case.status_changed
X-Renovo-Delivery-Id: del_xyz
X-Renovo-Timestamp: 1712847600
```

Signature computed over: `{timestamp}.{raw_body}`

Partners verify:
```python
import hmac, hashlib
expected = hmac.new(secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256).hexdigest()
assert hmac.compare_digest(signature, f"sha256={expected}")
```

## Event Naming Conventions

Format: `{resource}.{action}`

| Event | Trigger |
|-------|---------|
| `case.created` | New case created |
| `case.status_changed` | Case transitions to new status |
| `case.assigned` | Case assigned to operator |
| `case.document_generated` | AI draft or report generated |
| `case.resolved` | Case reaches final resolution |
| `inspection.received` | Inspection data received from partner |
| `claim.submitted` | Claim submitted to deposit scheme |
| `claim.outcome_received` | Deposit scheme returns decision |

---

## V1 Endpoints

### Push Inspection / Inventory Data

```
POST /v1/inspections
Authorization: Bearer renv1_live_...
Idempotency-Key: nlg-report-12345
```

Request:
```json
{
  "external_reference": "NLG-2026-00451",
  "inspection_type": "checkout",
  "property": {
    "address_line_1": "14 Oak Lane",
    "address_line_2": "Flat 3",
    "city": "Manchester",
    "postcode": "M1 4BT"
  },
  "inspected_at": "2026-04-10T09:30:00Z",
  "inspector_name": "John Smith",
  "rooms": [
    {
      "name": "Living Room",
      "condition": "good",
      "cleanliness": "fair",
      "notes": "Minor scuff marks on skirting board",
      "photos": [
        {
          "url": "https://nlg-cdn.example.com/photos/abc.jpg",
          "caption": "Skirting board damage"
        }
      ]
    }
  ],
  "summary_notes": "Generally well-maintained. Minor cleaning issues in kitchen.",
  "documents": [
    {
      "name": "Full Checkout Report",
      "type": "checkout_report",
      "url": "https://nlg-cdn.example.com/reports/NLG-2026-00451.pdf",
      "mime_type": "application/pdf"
    }
  ]
}
```

Response (201 Created):
```json
{
  "id": "insp_abc123",
  "external_reference": "NLG-2026-00451",
  "status": "received",
  "matched_property_id": "prop_def456",
  "matched_tenancy_id": "ten_ghi789",
  "created_at": "2026-04-11T14:30:00Z"
}
```

Matching logic: System attempts to match by postcode + address_line_1 against cached properties.

### Query Case Status

```
GET /v1/cases?tenancy_id=ten_ghi789&status=review
Authorization: Bearer renv1_live_...
```

Response:
```json
{
  "data": [
    {
      "id": "case_jkl012",
      "tenancy_id": "ten_ghi789",
      "property_address": "14 Oak Lane, Flat 3, Manchester M1 4BT",
      "status": "review",
      "priority": "medium",
      "assigned_to_name": "Sarah Johnson",
      "issue_count": 3,
      "total_claim_amount": "450.00",
      "created_at": "2026-04-10T10:00:00Z",
      "last_activity_at": "2026-04-11T09:15:00Z"
    }
  ],
  "pagination": {
    "has_more": false,
    "next_cursor": null,
    "total_count": 1
  }
}
```

### Retrieve Case Details

```
GET /v1/cases/{case_id}
Authorization: Bearer renv1_live_...
```

Response:
```json
{
  "id": "case_jkl012",
  "tenancy_id": "ten_ghi789",
  "property_address": "14 Oak Lane, Flat 3, Manchester M1 4BT",
  "status": "review",
  "priority": "medium",
  "assigned_to_name": "Sarah Johnson",
  "deposit_held": "1200.00",
  "deposit_scheme": "tds",
  "issues": [
    {
      "id": "iss_mno345",
      "title": "Kitchen deep clean required",
      "severity": "medium",
      "status": "open",
      "liability": "tenant",
      "estimated_cost": "150.00"
    }
  ],
  "documents": [
    {
      "id": "doc_pqr678",
      "name": "Liability Assessment",
      "type": "liability_assessment",
      "url": "/v1/cases/case_jkl012/documents/doc_pqr678/download",
      "generated_at": "2026-04-11T08:00:00Z"
    }
  ],
  "timeline_summary": [
    {
      "event": "case.created",
      "description": "Case created from checkout inspection",
      "at": "2026-04-10T10:00:00Z"
    },
    {
      "event": "case.status_changed",
      "description": "Moved to review",
      "at": "2026-04-11T09:15:00Z"
    }
  ],
  "created_at": "2026-04-10T10:00:00Z",
  "last_activity_at": "2026-04-11T09:15:00Z"
}
```

### Register Webhook

```
POST /v1/webhooks
Authorization: Bearer renv1_live_...
```

Request:
```json
{
  "url": "https://partner.example.com/hooks/renovo",
  "events": ["case.status_changed", "case.resolved"],
  "secret": "whsec_my_secret_key_here"
}
```

Response (201):
```json
{
  "id": "wh_abc123",
  "url": "https://partner.example.com/hooks/renovo",
  "events": ["case.status_changed", "case.resolved"],
  "status": "active",
  "created_at": "2026-04-11T14:30:00Z"
}
```

### List Webhooks

```
GET /v1/webhooks
```

### Delete Webhook

```
DELETE /v1/webhooks/{webhook_id}
```

### Push Document

```
POST /v1/inspections/{inspection_id}/documents
Authorization: Bearer renv1_live_...
Content-Type: multipart/form-data

file: <binary>
name: "Check-in Report - 14 Oak Lane"
document_type: "checkin_report"
```

Response (201):
```json
{
  "id": "doc_stu901",
  "inspection_id": "insp_abc123",
  "name": "Check-in Report - 14 Oak Lane",
  "document_type": "checkin_report",
  "file_size_bytes": 2048576,
  "created_at": "2026-04-11T14:35:00Z"
}
```

---

## OpenAPI Structure Outline

```yaml
openapi: "3.1.0"
info:
  title: Renovo Public API
  version: "1.0.0"
  description: Integration API for property management partners
servers:
  - url: https://api.renovoai.co.uk/v1
    description: Production
  - url: https://api.sandbox.renovoai.co.uk/v1
    description: Sandbox
security:
  - BearerAuth: []
  - OAuth2: [inventory:write, cases:read]
paths:
  /oauth/token:
    post: { ... }
  /inspections:
    post: { ... }
  /inspections/{inspection_id}/documents:
    post: { ... }
  /cases:
    get: { ... }
  /cases/{case_id}:
    get: { ... }
  /cases/{case_id}/documents/{document_id}/download:
    get: { ... }
  /webhooks:
    get: { ... }
    post: { ... }
  /webhooks/{webhook_id}:
    delete: { ... }
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
    OAuth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: /v1/oauth/token
          scopes:
            inventory:write: Push inspection data
            inventory:read: Read inspections
            cases:read: Read case data
            cases:write: Modify case data
            documents:write: Push documents
            documents:read: Read documents
            webhooks:manage: Manage webhook subscriptions
  schemas:
    Error: { ... }
    Inspection: { ... }
    Case: { ... }
    CaseDetail: { ... }
    Webhook: { ... }
    PaginatedResponse: { ... }
```

## Implementation Notes

### Where this lives in the repo

```
backend/app/api/public/
├── __init__.py
├── router.py          # Main /v1/ router
├── auth.py            # OAuth token issuance + API key validation
├── inspections.py     # POST /inspections, POST /inspections/{id}/documents
├── cases.py           # GET /cases, GET /cases/{id}
├── webhooks.py        # CRUD for webhook registrations
├── rate_limit.py      # Rate limiting middleware
└── schemas.py         # Public API Pydantic models (separate from internal schemas)
```

### Key difference from internal API

The public API has its own:
- Auth system (OAuth/API key, not HMAC internal auth)
- Rate limiting (not present on internal routes)
- Response format (envelope with `data` + `pagination`, not bare objects)
- Error format (structured error object, not just `{detail: string}`)
- Separate Pydantic schemas (public-facing field names may differ from internal)

The public API calls the same service layer as internal routes — no data duplication.
