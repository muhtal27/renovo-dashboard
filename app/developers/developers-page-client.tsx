'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const BASE_URL = 'https://backend.renovoai.co.uk/v1'

type Endpoint = {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  title: string
  description: string
  scope: string
  requestBody?: string
  responseBody: string
  notes?: string[]
}

type Section = {
  id: string
  title: string
  description: string
  endpoints: Endpoint[]
}

const sections: Section[] = [
  {
    id: 'authentication',
    title: 'Authentication',
    description:
      'Renovo uses OAuth 2.0 Client Credentials to issue short-lived JWT tokens. Sandbox apps can also use long-lived API keys prefixed with renv1_test_sk_.',
    endpoints: [
      {
        method: 'POST',
        path: '/oauth/token',
        title: 'Create access token',
        description:
          'Exchange your client credentials for a JWT bearer token. Tokens expire after 1 hour by default.',
        scope: 'none',
        requestBody: `// Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=your_client_id
&client_secret=your_client_secret
&scope=cases:read documents:read`,
        responseBody: `{
  "access_token": "renv1_live_eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "cases:read documents:read"
}`,
        notes: [
          'Requested scopes are intersected with your app\u2019s granted scopes.',
          'Sandbox tokens are prefixed renv1_test_, production tokens renv1_live_.',
        ],
      },
    ],
  },
  {
    id: 'inspections',
    title: 'Inspections',
    description:
      'Push checkout or check-in inspection data from your inventory platform into Renovo. Inspections are automatically matched to tenancies when possible.',
    endpoints: [
      {
        method: 'POST',
        path: '/inspections',
        title: 'Create inspection',
        description:
          'Push a property inspection with rooms, photos, and documents. Supports idempotent retries via the Idempotency-Key header.',
        scope: 'inventory:write',
        requestBody: `{
  "external_reference": "INV-2026-0042",
  "inspection_type": "checkout",
  "property": {
    "address_line_1": "14 Marchmont Crescent",
    "address_line_2": "Flat 3",
    "city": "Edinburgh",
    "postcode": "EH9 1HQ"
  },
  "inspected_at": "2026-04-10T14:30:00Z",
  "inspector_name": "Sarah Mitchell",
  "rooms": [
    {
      "name": "Kitchen",
      "condition": "fair",
      "cleanliness": "requires_clean",
      "notes": "Limescale on taps, grease on extractor hood.",
      "photos": [
        {
          "url": "https://cdn.example.com/photos/kitchen-01.jpg",
          "caption": "Kitchen overview"
        }
      ]
    }
  ],
  "summary_notes": "Property requires professional clean before re-let.",
  "documents": [
    {
      "name": "Full Checkout Report",
      "type": "checkout_report",
      "url": "https://cdn.example.com/reports/inv-2026-0042.pdf",
      "mime_type": "application/pdf"
    }
  ]
}`,
        responseBody: `{
  "id": "019622f1-a3b4-7c8d-9e0f-1a2b3c4d5e6f",
  "external_reference": "INV-2026-0042",
  "status": "received",
  "matched_property_id": "018f...",
  "matched_tenancy_id": "018f...",
  "created_at": "2026-04-10T14:31:02Z"
}`,
        notes: [
          'inspection_type accepts: checkout, checkin, interim.',
          'Set Idempotency-Key header to safely retry on network failure.',
          'Triggers the inspection.received webhook event.',
        ],
      },
      {
        method: 'POST',
        path: '/inspections/{inspection_id}/documents',
        title: 'Add inspection document',
        description: 'Attach an additional document to an existing inspection.',
        scope: 'documents:write',
        requestBody: `{
  "name": "Schedule of Condition",
  "document_type": "schedule_of_condition",
  "url": "https://cdn.example.com/docs/soc-042.pdf",
  "mime_type": "application/pdf"
}`,
        responseBody: `{
  "id": "019622f2-...",
  "inspection_id": "019622f1-...",
  "name": "Schedule of Condition",
  "document_type": "schedule_of_condition",
  "created_at": "2026-04-10T14:35:00Z"
}`,
      },
    ],
  },
  {
    id: 'cases',
    title: 'Cases',
    description:
      'Read end-of-tenancy cases including issues, evidence, documents, and timeline events. Cases are created automatically by Renovo when inspections are received or tenancies approach their end date.',
    endpoints: [
      {
        method: 'GET',
        path: '/cases',
        title: 'List cases',
        description:
          'Retrieve a paginated list of cases. Supports filtering by status and tenancy, with cursor-based pagination.',
        scope: 'cases:read',
        responseBody: `{
  "data": [
    {
      "id": "018f...",
      "tenancy_id": "018e...",
      "property_address": "14 Marchmont Crescent, Flat 3, EH9 1HQ",
      "status": "review",
      "priority": "medium",
      "assigned_to_name": "James Cooper",
      "issue_count": 4,
      "total_claim_amount": "385.00",
      "created_at": "2026-04-02T09:12:00Z",
      "last_activity_at": "2026-04-10T16:45:00Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJjIjoiMjAyNi...",
    "total_count": 47
  }
}`,
        notes: [
          'Query params: ?status=review&limit=20&cursor=...',
          'Maximum limit is 100. Default is 20.',
        ],
      },
      {
        method: 'GET',
        path: '/cases/{case_id}',
        title: 'Get case detail',
        description:
          'Retrieve full case detail including issues, documents, and a summary timeline.',
        scope: 'cases:read',
        responseBody: `{
  "id": "018f...",
  "tenancy_id": "018e...",
  "property_address": "14 Marchmont Crescent, Flat 3, EH9 1HQ",
  "status": "review",
  "priority": "medium",
  "assigned_to_name": "James Cooper",
  "deposit_held": "1200.00",
  "deposit_scheme": "tds",
  "issues": [
    {
      "id": "019a...",
      "title": "Kitchen extractor hood - grease build-up",
      "severity": "moderate",
      "status": "confirmed",
      "liability": "tenant",
      "estimated_cost": "85.00"
    }
  ],
  "documents": [
    {
      "id": "019b...",
      "name": "Claim Letter Draft",
      "type": "claim_letter",
      "url": "/v1/cases/018f.../documents/019b.../download",
      "generated_at": "2026-04-09T11:00:00Z"
    }
  ],
  "timeline_summary": [
    {
      "event": "case.created",
      "description": "Case created from checkout inspection",
      "at": "2026-04-02T09:12:00Z"
    }
  ],
  "created_at": "2026-04-02T09:12:00Z",
  "last_activity_at": "2026-04-10T16:45:00Z"
}`,
      },
      {
        method: 'GET',
        path: '/cases/{case_id}/documents/{document_id}/download',
        title: 'Download document',
        description: 'Get a time-limited pre-signed URL to download a case document.',
        scope: 'documents:read',
        responseBody: `{
  "download_url": "https://storage.supabase.co/...",
  "expires_in": 3600
}`,
      },
    ],
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    description:
      'Register HTTPS endpoints to receive real-time event notifications. Renovo signs every delivery with HMAC-SHA256 so you can verify authenticity.',
    endpoints: [
      {
        method: 'POST',
        path: '/webhooks',
        title: 'Register webhook',
        description:
          'Subscribe to one or more event types. Each delivery includes an X-Renovo-Signature header for verification.',
        scope: 'webhooks:manage',
        requestBody: `{
  "url": "https://your-app.com/webhooks/renovo",
  "events": [
    "case.created",
    "case.status_changed",
    "inspection.received",
    "claim.submitted"
  ],
  "secret": "whsec_your_random_secret_min_32_chars_long"
}`,
        responseBody: `{
  "id": "019c...",
  "url": "https://your-app.com/webhooks/renovo",
  "events": ["case.created", "case.status_changed", "inspection.received", "claim.submitted"],
  "status": "active",
  "created_at": "2026-04-11T10:00:00Z"
}`,
        notes: [
          'URL must use HTTPS.',
          'Secret must be 32\u2013256 characters.',
          'Duplicate URLs per app are rejected.',
        ],
      },
      {
        method: 'GET',
        path: '/webhooks',
        title: 'List webhooks',
        description: 'List all active webhook registrations for your application.',
        scope: 'webhooks:manage',
        responseBody: `[
  {
    "id": "019c...",
    "url": "https://your-app.com/webhooks/renovo",
    "events": ["case.created", "case.status_changed"],
    "status": "active",
    "created_at": "2026-04-11T10:00:00Z"
  }
]`,
      },
      {
        method: 'DELETE',
        path: '/webhooks/{webhook_id}',
        title: 'Delete webhook',
        description: 'Remove a webhook registration. Returns 204 No Content on success.',
        scope: 'webhooks:manage',
        responseBody: '// 204 No Content',
      },
    ],
  },
]

const webhookEvents = [
  { event: 'case.created', description: 'A new EOT case has been created.' },
  { event: 'case.status_changed', description: 'A case moved to a new status (e.g. draft \u2192 review).' },
  { event: 'case.assigned', description: 'A case was assigned to an operator.' },
  { event: 'case.document_generated', description: 'A claim letter or evidence bundle was generated.' },
  { event: 'case.resolved', description: 'A case was marked as resolved.' },
  { event: 'inspection.received', description: 'An inspection was pushed via the API.' },
  { event: 'claim.submitted', description: 'A deposit claim was submitted to a scheme.' },
  { event: 'claim.outcome_received', description: 'An adjudication outcome was received.' },
]

const scopes = [
  { scope: 'inventory:write', description: 'Create inspections and push inventory data.' },
  { scope: 'documents:write', description: 'Add documents to inspections.' },
  { scope: 'cases:read', description: 'List and read case data.' },
  { scope: 'documents:read', description: 'Download case documents.' },
  { scope: 'webhooks:manage', description: 'Register and manage webhook endpoints.' },
]

const errorCodes = [
  { code: 'unauthorized', status: 401, description: 'Missing or invalid token.' },
  { code: 'forbidden', status: 403, description: 'Valid token but insufficient scopes.' },
  { code: 'not_found', status: 404, description: 'Resource not found.' },
  { code: 'validation_error', status: 400, description: 'Request body failed validation.' },
  { code: 'conflict', status: 409, description: 'Idempotency key reused or duplicate resource.' },
  { code: 'rate_limited', status: 429, description: 'Rate limit exceeded. Check Retry-After header.' },
  { code: 'internal_error', status: 500, description: 'Server error. Contact support with the request_id.' },
]

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-700 border-blue-200',
    POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${colors[method] ?? 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
    >
      {method}
    </span>
  )
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative rounded-lg border border-zinc-200 bg-zinc-950 text-sm">
      {title && (
        <div className="border-b border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400">
          {title}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-300">
        <code>{children}</code>
      </pre>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="scroll-mt-24 border-b border-zinc-200 py-8 last:border-0" id={endpoint.path.replace(/[{}\/]/g, '-')}>
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-zinc-950">{endpoint.path}</code>
        {endpoint.scope !== 'none' && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {endpoint.scope}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-base font-semibold text-zinc-950">{endpoint.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{endpoint.description}</p>

      {endpoint.notes && (
        <ul className="mt-3 space-y-1">
          {endpoint.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {note}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {endpoint.requestBody && (
          <CodeBlock title="Request">{endpoint.requestBody}</CodeBlock>
        )}
        <CodeBlock title="Response">{endpoint.responseBody}</CodeBlock>
      </div>
    </div>
  )
}

function SideNav({ activeSection }: { activeSection: string }) {
  const allSections = [
    { id: 'overview', title: 'Overview' },
    ...sections.map((s) => ({ id: s.id, title: s.title })),
    { id: 'events', title: 'Webhook Events' },
    { id: 'scopes', title: 'Scopes' },
    { id: 'errors', title: 'Error Handling' },
    { id: 'rate-limits', title: 'Rate Limits' },
  ]

  return (
    <nav className="hidden lg:block" aria-label="API documentation sections">
      <div className="sticky top-24 space-y-0.5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
          On this page
        </p>
        {allSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeSection === s.id
                ? 'bg-emerald-50 font-medium text-emerald-700'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            {s.title}
          </a>
        ))}
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DevelopersPageClient() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <MarketingShell currentPath="/developers" navAriaLabel="Developer docs">
      <div className="marketing-frame py-16 md:py-24">
        {/* Hero */}
        <header className="mb-16" id="overview">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
            Developer Documentation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
            Renovo Public API
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-500">
            Integrate your property management or inventory platform with Renovo.
            Push inspections, read cases, download documents, and receive real-time
            webhooks &mdash; all through a single REST API.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-950">Base URL</span>
              <code className="rounded bg-zinc-200/60 px-2 py-0.5 text-xs text-zinc-700">
                {BASE_URL}
              </code>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-950">Auth</span>
              <span className="text-zinc-500">OAuth 2.0 / API Keys</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-950">Format</span>
              <span className="text-zinc-500">JSON</span>
            </span>
          </div>

          {/* Quick start */}
          <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-sm font-semibold text-zinc-950">Quick start</h2>
            <div className="mt-3 space-y-4">
              <CodeBlock title="1. Get an access token">{`curl -X POST ${BASE_URL}/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"`}</CodeBlock>
              <CodeBlock title="2. Use the token to list cases">{`curl ${BASE_URL}/cases \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}</CodeBlock>
            </div>
          </div>
        </header>

        {/* Layout: sidebar + content */}
        <div className="grid gap-12 lg:grid-cols-[200px_1fr]">
          <SideNav activeSection={activeSection} />

          <div>
            {/* Endpoint sections */}
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 mb-16">
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {section.description}
                </p>
                <div className="mt-6">
                  {section.endpoints.map((ep) => (
                    <EndpointCard key={ep.path + ep.method} endpoint={ep} />
                  ))}
                </div>
              </section>
            ))}

            {/* Webhook events */}
            <section id="events" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                Webhook Events
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Subscribe to any combination of these events when registering a webhook.
                Each delivery is signed with HMAC-SHA256 using your webhook secret.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookEvents.map((e) => (
                      <tr key={e.event} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                            {e.event}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-950">Delivery headers</h3>
                <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 text-left font-semibold text-zinc-950">Header</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-950">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100">
                        <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-Renovo-Event</code></td>
                        <td className="px-4 py-3 text-zinc-600">The event type (e.g. case.created).</td>
                      </tr>
                      <tr className="border-b border-zinc-100">
                        <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-Renovo-Delivery-Id</code></td>
                        <td className="px-4 py-3 text-zinc-600">Unique ID for this delivery (for deduplication).</td>
                      </tr>
                      <tr className="border-b border-zinc-100">
                        <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-Renovo-Timestamp</code></td>
                        <td className="px-4 py-3 text-zinc-600">Unix timestamp of when the event was sent.</td>
                      </tr>
                      <tr className="last:border-0">
                        <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-Renovo-Signature</code></td>
                        <td className="px-4 py-3 text-zinc-600">HMAC-SHA256 signature: sha256=&lt;hex&gt;.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-950">Verifying signatures</h3>
                <CodeBlock>{`import hmac, hashlib

def verify(body: bytes, secret: str, signature: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}</CodeBlock>
              </div>
            </section>

            {/* Scopes */}
            <section id="scopes" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">Scopes</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Each endpoint requires a specific scope. Request only the scopes you need
                when exchanging credentials for a token.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Scope</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopes.map((s) => (
                      <tr key={s.scope} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                            {s.scope}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{s.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Errors */}
            <section id="errors" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">
                Error Handling
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                All errors return a consistent JSON structure with a machine-readable code,
                a human-readable message, and the request ID for debugging.
              </p>
              <div className="mt-4">
                <CodeBlock title="Error response format">{`{
  "error": {
    "code": "validation_error",
    "message": "Webhook URL must use HTTPS",
    "request_id": "req_a1b2c3d4",
    "details": [
      {
        "field": "url",
        "issue": "https_required",
        "message": "URL must start with https://"
      }
    ]
  }
}`}</CodeBlock>
              </div>
              <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">HTTP</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorCodes.map((e) => (
                      <tr key={e.code} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                            {e.code}
                          </code>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-600">{e.status}</td>
                        <td className="px-4 py-3 text-zinc-600">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate limits */}
            <section id="rate-limits" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">Rate Limits</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                The API enforces a sliding-window rate limit of 300 requests per hour
                per application. Every response includes rate limit headers.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Header</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-950">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100">
                      <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-RateLimit-Limit</code></td>
                      <td className="px-4 py-3 text-zinc-600">Maximum requests allowed per window.</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-RateLimit-Remaining</code></td>
                      <td className="px-4 py-3 text-zinc-600">Requests remaining in current window.</td>
                    </tr>
                    <tr className="border-b border-zinc-100">
                      <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">X-RateLimit-Reset</code></td>
                      <td className="px-4 py-3 text-zinc-600">Seconds until the window resets.</td>
                    </tr>
                    <tr className="last:border-0">
                      <td className="px-4 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">Retry-After</code></td>
                      <td className="px-4 py-3 text-zinc-600">Included in 429 responses. Seconds to wait before retrying.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center">
              <h2 className="text-lg font-bold text-zinc-950">Ready to integrate?</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Get your API credentials and start building your integration today.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/book-demo"
                  className="app-primary-button rounded-md px-5 py-2.5 text-sm font-medium"
                >
                  Book a demo
                </Link>
                <Link
                  href="/contact"
                  className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Contact us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}
