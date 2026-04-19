'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const BASE_URL = 'https://api.renovoai.co.uk/v1'
const SANDBOX_URL = 'https://api.sandbox.renovoai.co.uk/v1'

type Endpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  title: string
  description: string
  scope: string
  statusCode?: number
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
        statusCode: 200,
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
        statusCode: 201,
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
        method: 'GET',
        path: '/inspections',
        title: 'List inspections',
        description:
          'Retrieve a paginated list of inspections pushed by your application. Supports filtering by type and status.',
        scope: 'inventory:read',
        statusCode: 200,
        responseBody: `{
  "data": [
    {
      "id": "019622f1-a3b4-7c8d-9e0f-1a2b3c4d5e6f",
      "external_reference": "INV-2026-0042",
      "inspection_type": "checkout",
      "status": "received",
      "property_address": "14 Marchmont Crescent, Flat 3, EH9 1HQ",
      "matched_tenancy_id": "018f...",
      "inspected_at": "2026-04-10T14:30:00Z",
      "created_at": "2026-04-10T14:31:02Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJjIjoiMjAyNi...",
    "total_count": 23
  }
}`,
        notes: [
          'Query params: ?inspection_type=checkout&status=received&limit=20&cursor=...',
          'Maximum limit is 100. Default is 20.',
        ],
      },
      {
        method: 'POST',
        path: '/inspections/{inspection_id}/documents',
        title: 'Upload inspection document',
        description:
          'Attach an additional document to an existing inspection. Uses multipart/form-data for binary file upload.',
        scope: 'documents:write',
        statusCode: 201,
        requestBody: `// Content-Type: multipart/form-data

file: <binary>
name: "Schedule of Condition"
document_type: "schedule_of_condition"`,
        responseBody: `{
  "id": "019622f2-...",
  "inspection_id": "019622f1-...",
  "name": "Schedule of Condition",
  "document_type": "schedule_of_condition",
  "file_size_bytes": 2048576,
  "created_at": "2026-04-10T14:35:00Z"
}`,
        notes: [
          'Maximum file size: 25 MB.',
          'Accepted types: application/pdf, image/jpeg, image/png.',
        ],
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
        statusCode: 200,
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
          'Query params: ?status=review&tenancy_id=...&limit=20&cursor=...',
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
        statusCode: 200,
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
        statusCode: 200,
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
        statusCode: 201,
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
        description: 'List all webhook registrations for your application with cursor-based pagination.',
        scope: 'webhooks:manage',
        statusCode: 200,
        responseBody: `{
  "data": [
    {
      "id": "019c...",
      "url": "https://your-app.com/webhooks/renovo",
      "events": ["case.created", "case.status_changed"],
      "status": "active",
      "created_at": "2026-04-11T10:00:00Z"
    }
  ],
  "pagination": {
    "has_more": false,
    "next_cursor": null,
    "total_count": 1
  }
}`,
      },
      {
        method: 'PATCH',
        path: '/webhooks/{webhook_id}',
        title: 'Update webhook',
        description:
          'Update a webhook\u2019s subscribed events or URL. Only include the fields you want to change.',
        scope: 'webhooks:manage',
        statusCode: 200,
        requestBody: `{
  "events": [
    "case.created",
    "case.status_changed",
    "case.resolved"
  ]
}`,
        responseBody: `{
  "id": "019c...",
  "url": "https://your-app.com/webhooks/renovo",
  "events": ["case.created", "case.status_changed", "case.resolved"],
  "status": "active",
  "created_at": "2026-04-11T10:00:00Z",
  "updated_at": "2026-04-12T08:30:00Z"
}`,
        notes: [
          'Only url, events, and secret can be updated.',
          'Omitted fields are left unchanged.',
        ],
      },
      {
        method: 'DELETE',
        path: '/webhooks/{webhook_id}',
        title: 'Delete webhook',
        description: 'Remove a webhook registration. Returns 204 No Content on success.',
        scope: 'webhooks:manage',
        statusCode: 204,
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
  { scope: 'inventory:read', description: 'List and retrieve inspection records.' },
  { scope: 'cases:read', description: 'List and read case data.' },
  { scope: 'cases:write', description: 'Update case data (specific integrations only).' },
  { scope: 'documents:write', description: 'Upload documents to inspections.' },
  { scope: 'documents:read', description: 'Download case documents.' },
  { scope: 'webhooks:manage', description: 'Register and manage webhook endpoints.' },
]

const errorCodes = [
  { code: 'validation_error', status: 400, description: 'Request body or query params failed validation.' },
  { code: 'unauthorized', status: 401, description: 'Missing or invalid token.' },
  { code: 'forbidden', status: 403, description: 'Valid token but insufficient scopes.' },
  { code: 'not_found', status: 404, description: 'Resource not found.' },
  { code: 'conflict', status: 409, description: 'Idempotency key reused with different payload.' },
  { code: 'unprocessable', status: 422, description: 'Valid syntax but violates a business rule.' },
  { code: 'rate_limited', status: 429, description: 'Rate limit exceeded. Check Retry-After header.' },
  { code: 'internal_error', status: 500, description: 'Server error. Contact support with the request_id.' },
]

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-700 border-blue-200',
    POST: 'bg-emerald-500/15 text-emerald-300 border-emerald-200',
    PATCH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${colors[method] ?? 'bg-white/[0.03] text-white/80 border-white/10'}`}
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
    <div className="group relative rounded-lg border border-white/10 bg-[#0a0e1a] text-sm">
      {title && (
        <div className="border-b border-white/10 px-4 py-2 text-xs font-medium text-white/40">
          {title}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-zinc-700 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/40 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
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
    <div className="scroll-mt-24 border-b border-white/10 py-8 last:border-0" id={endpoint.path.replace(/[{}\/]/g, '-')}>
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-white">{endpoint.path}</code>
        {endpoint.statusCode && (
          <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11px] font-mono font-medium text-white/55">
            {endpoint.statusCode}
          </span>
        )}
        {endpoint.scope !== 'none' && (
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/55">
            {endpoint.scope}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-base font-semibold text-white">{endpoint.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/65">{endpoint.description}</p>

      {endpoint.notes && (
        <ul className="mt-3 space-y-1">
          {endpoint.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/55">
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
    { id: 'getting-started', title: 'Getting Started' },
    ...sections.map((s) => ({ id: s.id, title: s.title })),
    { id: 'events', title: 'Webhook Events' },
    { id: 'scopes', title: 'Scopes' },
    { id: 'errors', title: 'Error Handling' },
    { id: 'rate-limits', title: 'Rate Limits' },
    { id: 'idempotency', title: 'Idempotency' },
    { id: 'versioning', title: 'Versioning' },
    { id: 'sandbox', title: 'Sandbox' },
    { id: 'changelog', title: 'Changelog' },
  ]

  return (
    <nav className="hidden lg:block" aria-label="API documentation sections">
      <div className="sticky top-24 space-y-0.5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
          On this page
        </p>
        {allSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeSection === s.id
                ? 'bg-emerald-500/15 font-medium text-emerald-300'
                : 'text-white/55 hover:bg-white/[0.03] hover:text-white'
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
  useEffect(() => {
    const sectionIds = [
      'overview', 'getting-started',
      ...sections.map((s) => s.id),
      'events', 'scopes', 'errors', 'rate-limits',
      'idempotency', 'versioning', 'sandbox', 'changelog',
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <MarketingShell currentPath="/developers" navAriaLabel="Developer docs">
      <div className="marketing-frame py-16 md:py-24">
        {/* Hero */}
        <header className="mb-16" id="overview">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
            Developers
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            A clean REST API. <em className="font-bold not-italic text-white/45">A sandbox for every build.</em>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
            Production on{' '}
            <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[13px] text-emerald-300">
              api.renovoai.co.uk/v1
            </code>
            . Sandbox on{' '}
            <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[13px] text-emerald-300">
              api.sandbox.renovoai.co.uk/v1
            </code>
            . OAuth&nbsp;2.0 Client Credentials in production using short-lived JWTs. Long-lived keys in sandbox.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
              <span className="font-medium text-white">Production</span>
              <code className="rounded bg-zinc-200/60 px-2 py-0.5 text-xs text-white/80">
                {BASE_URL}
              </code>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
              <span className="font-medium text-white">Sandbox</span>
              <code className="rounded bg-zinc-200/60 px-2 py-0.5 text-xs text-white/80">
                {SANDBOX_URL}
              </code>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
              <span className="font-medium text-white">Auth</span>
              <span className="text-white/55">OAuth 2.0 / API Keys</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
              <span className="font-medium text-white">Format</span>
              <span className="text-white/55">JSON</span>
            </span>
          </div>

          {/* Quick start */}
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-sm font-semibold text-white">Quick start</h2>
            <div className="mt-3 space-y-4">
              <CodeBlock title="1. Get an access token">{`curl -X POST ${BASE_URL}/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"`}</CodeBlock>
              <CodeBlock title="2. Use the token to list cases">{`curl ${BASE_URL}/cases \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}</CodeBlock>
            </div>
          </div>
        </header>

        {/* Getting started */}
        <section id="getting-started" className="scroll-mt-24 mb-16">
          <h2 className="text-xl font-bold tracking-tight text-white">Getting Started</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Follow these steps to start integrating with the Renovo API.
          </p>
          <ol className="mt-6 space-y-4">
            {[
              {
                step: '1',
                title: 'Register your application',
                description:
                  'Contact us or book a demo to get your application registered. We\u2019ll issue you a client_id and client_secret for production, and a sandbox API key for development.',
              },
              {
                step: '2',
                title: 'Authenticate in sandbox',
                description:
                  'Use your sandbox API key to make test requests against the sandbox environment. Sandbox tokens are prefixed renv1_test_sk_.',
              },
              {
                step: '3',
                title: 'Integrate your endpoints',
                description:
                  'Push inspections from your inventory platform, read case data, and register webhooks to receive real-time updates.',
              },
              {
                step: '4',
                title: 'Go live',
                description:
                  'When you\u2019re ready, switch to production credentials and the production base URL. Use OAuth 2.0 Client Credentials to obtain short-lived JWT tokens.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-300">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-white/55">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Layout: sidebar + content */}
        <div className="grid gap-12 lg:grid-cols-[200px_1fr]">
          <SideNav activeSection={activeSection} />

          <div>
            {/* Endpoint sections */}
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 mb-16">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
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
              <h2 className="text-xl font-bold tracking-tight text-white">
                Webhook Events
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Subscribe to any combination of these events when registering a webhook.
                Each delivery is signed with HMAC-SHA256 using your webhook secret.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Event</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookEvents.map((e) => (
                      <tr key={e.event} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs font-medium text-white/80">
                            {e.event}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-white/65">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">Delivery headers</h3>
                <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="px-4 py-3 text-left font-semibold text-white">Header</th>
                        <th className="px-4 py-3 text-left font-semibold text-white">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/[0.06]">
                        <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-Renovo-Event</code></td>
                        <td className="px-4 py-3 text-white/65">The event type (e.g. case.created).</td>
                      </tr>
                      <tr className="border-b border-white/[0.06]">
                        <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-Renovo-Delivery-Id</code></td>
                        <td className="px-4 py-3 text-white/65">Unique ID for this delivery (for deduplication).</td>
                      </tr>
                      <tr className="border-b border-white/[0.06]">
                        <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-Renovo-Timestamp</code></td>
                        <td className="px-4 py-3 text-white/65">Unix timestamp of when the event was sent.</td>
                      </tr>
                      <tr className="last:border-0">
                        <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-Renovo-Signature</code></td>
                        <td className="px-4 py-3 text-white/65">HMAC-SHA256 signature: sha256=&lt;hex&gt;.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">Example delivery payload</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  When an event fires, Renovo sends a POST request to your registered URL with this structure:
                </p>
                <div className="mt-3">
                  <CodeBlock title="Webhook delivery body">{`{
  "id": "del_a1b2c3d4",
  "event": "case.status_changed",
  "created_at": "2026-04-11T14:30:00Z",
  "data": {
    "case_id": "018f...",
    "tenancy_id": "018e...",
    "property_address": "14 Marchmont Crescent, Flat 3, EH9 1HQ",
    "previous_status": "draft",
    "new_status": "review",
    "changed_at": "2026-04-11T14:30:00Z"
  }
}`}</CodeBlock>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white">Verifying signatures</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  The signature is computed over <code className="rounded bg-white/[0.05] px-1 py-0.5 text-xs">{'{timestamp}.{raw_body}'}</code> using
                  your webhook secret. Always verify signatures before processing deliveries.
                </p>
                <div className="mt-3 space-y-4">
                  <CodeBlock title="Python">{`import hmac, hashlib

def verify(body: bytes, secret: str, timestamp: str, signature: str) -> bool:
    payload = f"{timestamp}.".encode() + body
    expected = "sha256=" + hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}</CodeBlock>
                  <CodeBlock title="Node.js">{`const crypto = require('crypto');

function verify(body, secret, timestamp, signature) {
  const payload = \`\${timestamp}.\${body}\`;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}</CodeBlock>
                </div>
              </div>
            </section>

            {/* Scopes */}
            <section id="scopes" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Scopes</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Each endpoint requires a specific scope. Request only the scopes you need
                when exchanging credentials for a token.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Scope</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopes.map((s) => (
                      <tr key={s.scope} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs font-medium text-white/80">
                            {s.scope}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-white/65">{s.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Errors */}
            <section id="errors" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Error Handling
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
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
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">HTTP</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorCodes.map((e) => (
                      <tr key={e.code} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3">
                          <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs font-medium text-white/80">
                            {e.code}
                          </code>
                        </td>
                        <td className="px-4 py-3 font-mono text-white/65">{e.status}</td>
                        <td className="px-4 py-3 text-white/65">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate limits */}
            <section id="rate-limits" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Rate Limits</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                The API enforces a sliding-window rate limit per minute per application.
                Limits vary by environment tier. Every response includes rate limit headers.
              </p>

              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Tier</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Requests / minute</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Burst</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">Sandbox</td>
                      <td className="px-4 py-3 font-mono text-white/65">60</td>
                      <td className="px-4 py-3 font-mono text-white/65">10</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">Production</td>
                      <td className="px-4 py-3 font-mono text-white/65">300</td>
                      <td className="px-4 py-3 font-mono text-white/65">50</td>
                    </tr>
                    <tr className="last:border-0">
                      <td className="px-4 py-3 text-white/65">Enterprise</td>
                      <td className="px-4 py-3 font-mono text-white/65">1,000</td>
                      <td className="px-4 py-3 font-mono text-white/65">100</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 text-sm font-semibold text-white">Response headers</h3>
              <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Header</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-RateLimit-Limit</code></td>
                      <td className="px-4 py-3 text-white/65">Maximum requests allowed per window.</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-RateLimit-Remaining</code></td>
                      <td className="px-4 py-3 text-white/65">Requests remaining in current window.</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">X-RateLimit-Reset</code></td>
                      <td className="px-4 py-3 text-white/65">Unix timestamp when the window resets.</td>
                    </tr>
                    <tr className="last:border-0">
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">Retry-After</code></td>
                      <td className="px-4 py-3 text-white/65">Included in 429 responses. Seconds to wait before retrying.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Idempotency */}
            <section id="idempotency" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Idempotency</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                All POST, PUT, and PATCH endpoints accept an <code className="rounded bg-white/[0.05] px-1 py-0.5 text-xs">Idempotency-Key</code> header
                so you can safely retry requests on network failure without creating duplicate resources.
              </p>
              <div className="mt-4">
                <CodeBlock title="Example header">{`POST /v1/inspections HTTP/1.1
Authorization: Bearer renv1_live_...
Idempotency-Key: your-unique-key-per-request
Content-Type: application/json`}</CodeBlock>
              </div>
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Scenario</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Behaviour</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">First request</td>
                      <td className="px-4 py-3 text-white/65">Processed normally. Response cached for 24 hours.</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">Same key, same payload</td>
                      <td className="px-4 py-3 text-white/65">Returns the cached response (not re-processed).</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">Same key, different payload</td>
                      <td className="px-4 py-3 text-white/65">Returns <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">409 Conflict</code>.</td>
                    </tr>
                    <tr className="last:border-0">
                      <td className="px-4 py-3 text-white/65">No key provided</td>
                      <td className="px-4 py-3 text-white/65">Processed without idempotency protection.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Versioning */}
            <section id="versioning" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Versioning</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                The API is versioned via URL path. The current version is <code className="rounded bg-white/[0.05] px-1 py-0.5 text-xs">/v1/</code>.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  'Non-breaking additions (new fields, new optional parameters) do not require a version bump.',
                  'Breaking changes (field removal, type changes, behaviour changes) will ship under a new version.',
                  'Deprecated versions are supported for 12 months after the deprecation announcement.',
                  'Deprecation notices are sent via email and the X-Renovo-Deprecated header.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Sandbox */}
            <section id="sandbox" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Sandbox Environment</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Use the sandbox environment for development and testing. Sandbox data is
                isolated from production and can be reset at any time.
              </p>
              <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="px-4 py-3 text-left font-semibold text-white">Environment</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Base URL</th>
                      <th className="px-4 py-3 text-left font-semibold text-white">Auth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-white/65">Production</td>
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">{BASE_URL}</code></td>
                      <td className="px-4 py-3 text-white/65">OAuth 2.0 (tokens prefixed <code className="rounded bg-white/[0.05] px-1 py-0.5 text-xs text-white/80">renv1_live_</code>)</td>
                    </tr>
                    <tr className="last:border-0">
                      <td className="px-4 py-3 text-white/65">Sandbox</td>
                      <td className="px-4 py-3"><code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-xs text-white/80">{SANDBOX_URL}</code></td>
                      <td className="px-4 py-3 text-white/65">API keys (prefixed <code className="rounded bg-white/[0.05] px-1 py-0.5 text-xs text-white/80">renv1_test_sk_</code>)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-2">
                {[
                  'Sandbox API keys are long-lived and do not expire, but can be rotated from your dashboard.',
                  'Sandbox rate limits are lower (60 requests/minute) to prevent accidental load.',
                  'Webhook deliveries in sandbox are tagged with a test: true field.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Changelog */}
            <section id="changelog" className="scroll-mt-24 mb-16">
              <h2 className="text-xl font-bold tracking-tight text-white">Changelog</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                We publish API changes and deprecation notices here. Subscribe to updates
                via your application settings in the Renovo dashboard.
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-300">New</span>
                    <span className="text-xs text-white/40">2026-04-13</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">API v1 public launch</p>
                  <p className="mt-1 text-sm text-white/55">
                    Initial release of the Renovo Public API with inspections, cases, documents, and webhooks.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <h2 className="text-lg font-bold text-white">Ready to integrate?</h2>
              <p className="mt-2 text-sm text-white/55">
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
                  className="rounded-md border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.03]"
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
