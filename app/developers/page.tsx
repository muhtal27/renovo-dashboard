import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Developers. Renovo AI',
  description:
    'A clean REST API. A sandbox for every build. OAuth 2.0 Client Credentials in production, long lived keys in sandbox, webhooks with HMAC SHA256.',
  path: '/developers',
})

const devItems = [
  {
    head: 'Inspections API.',
    body: 'Push checkout, check in, or interim inventory reports. Rooms, photos, documents. Idempotency Key header for safe retries.',
  },
  {
    head: 'Cases API.',
    body: 'Retrieve cases with issues, evidence, and documents. Cases open automatically from inspections or tenancy end dates.',
  },
  {
    head: 'Documents API.',
    body: 'Upload attachments up to 25 MB. Download via time limited pre signed URLs.',
  },
  {
    head: 'Webhooks.',
    body: 'HMAC SHA256 signed payloads, idempotent delivery with retries.',
  },
  {
    head: 'Rate limits.',
    body: '60 per minute sandbox, 300 per minute production, 1,000 per minute Enterprise.',
  },
]

const webhookEvents = [
  'case.created',
  'case.status_changed',
  'case.assigned',
  'case.document_generated',
  'case.resolved',
  'inspection.received',
  'claim.submitted',
  'claim.outcome_received',
]

export default function DevelopersPage() {
  const monoEm = { color: 'var(--em-300)' } as const
  return (
    <MarketingShell currentPath="/developers">
      <section className="page-hero">
        <p className="kicker">Developers</p>
        <h1>
          A clean REST API.
          <br />
          <span className="accent">A sandbox for every build.</span>
        </h1>
        <p className="page-hero-sub">
          Production on <span className="mono" style={monoEm}>api.renovoai.co.uk/v1</span>. Sandbox on{' '}
          <span className="mono" style={monoEm}>api.sandbox.renovoai.co.uk/v1</span>. OAuth 2.0 Client Credentials in production using short lived JWTs. Long lived keys in sandbox.
        </p>
      </section>

      <section className="section first">
        <div className="dev-grid">
          <div>
            <div className="dev-list">
              {devItems.map((i) => (
                <div key={i.head} className="dev-item">
                  <span className="dev-item-check">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>
                    <strong>{i.head}</strong> {i.body}
                  </span>
                </div>
              ))}
              <div className="dev-item">
                <span className="dev-item-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>
                  <strong>Scopes.</strong>{' '}
                  <span className="mono" style={monoEm}>inventory:read/write</span>,{' '}
                  <span className="mono" style={monoEm}>cases:read/write</span>,{' '}
                  <span className="mono" style={monoEm}>documents:read/write</span>,{' '}
                  <span className="mono" style={monoEm}>webhooks:manage</span>.
                </span>
              </div>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/book-demo" className="btn-primary btn-lg">
                Request sandbox access →
              </Link>
              <a href="mailto:hello@renovoai.co.uk?subject=API%20docs" className="btn-outline">
                Email for docs
              </a>
            </div>
          </div>

          {/* Code card with language tabs + copy. Interactive behaviour provided
              by MarketingClientEffects via data-code-card / data-lang-pane / data-code-copy. */}
          <div className="code-card" data-code-card>
            <div className="code-chrome">
              <div className="code-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="code-chrome-r">
                <div className="code-tabs" role="tablist" aria-label="Language">
                  <button type="button" className="code-tab active" data-lang="curl" role="tab">
                    curl
                  </button>
                  <button type="button" className="code-tab" data-lang="node" role="tab">
                    node
                  </button>
                  <button type="button" className="code-tab" data-lang="python" role="tab">
                    python
                  </button>
                  <button type="button" className="code-tab" data-lang="ruby" role="tab">
                    ruby
                  </button>
                </div>
                <button type="button" className="code-copy" data-code-copy aria-label="Copy code">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span className="code-copy-label">Copy</span>
                </button>
              </div>
            </div>

            <pre className="code-body code-body-pane active" data-lang-pane="curl">
              <span className="code-comment"># Push a checkout from your inventory system</span>
              {`\ncurl `}<span className="code-str">&quot;https://api.renovoai.co.uk/v1/inspections&quot;</span>{` \\
  -H `}<span className="code-str">&quot;Authorization: Bearer $TOKEN&quot;</span>{` \\
  -H `}<span className="code-str">&quot;Idempotency-Key: chk_01HSV3...&quot;</span>{` \\
  -H `}<span className="code-str">&quot;Content-Type: application/json&quot;</span>{` \\
  -d `}<span className="code-str">{"'{"}</span>
              {`\n    `}<span className="code-key">&quot;type&quot;</span>: <span className="code-str">&quot;checkout&quot;</span>,
              {`\n    `}<span className="code-key">&quot;tenancy_ref&quot;</span>: <span className="code-str">&quot;RPT-448291&quot;</span>,
              {`\n    `}<span className="code-key">&quot;property&quot;</span>: {'{'}
              {`\n      `}<span className="code-key">&quot;address_line_1&quot;</span>: <span className="code-str">&quot;42 Leith Walk&quot;</span>,
              {`\n      `}<span className="code-key">&quot;postcode&quot;</span>: <span className="code-str">&quot;EH6 5PY&quot;</span>
              {`\n    `}{'},'}
              {`\n    `}<span className="code-key">&quot;deposit_pence&quot;</span>: <span className="code-num">110000</span>,
              {`\n    `}<span className="code-key">&quot;scheme&quot;</span>: <span className="code-str">&quot;sds&quot;</span>,
              {`\n    `}<span className="code-key">&quot;rooms&quot;</span>: [ ... ],
              {`\n    `}<span className="code-key">&quot;photos&quot;</span>: [ ... ]
              {`\n  `}<span className="code-str">{"}'"}</span>
              {`\n\n`}<span className="code-comment"># → 202 Accepted</span>
              {`\n`}<span className="code-comment"># {'{'} &quot;inspection_id&quot;: &quot;ins_01HSV3...&quot;,</span>
              {`\n`}<span className="code-comment">#   &quot;case_url&quot;: &quot;https://app.renovoai.co.uk/c/CHK-2026-482&quot; {'}'}</span>
            </pre>

            <pre className="code-body code-body-pane" data-lang-pane="node">
              <span className="code-comment">{`// Push a checkout from your inventory system`}</span>
              {`\n`}<span className="code-key">import</span> Renovo <span className="code-key">from</span> <span className="code-str">&apos;@renovo/node&apos;</span>
              {`\n\n`}<span className="code-key">const</span> renovo = <span className="code-key">new</span> Renovo({`{ apiKey: process.env.RENOVO_API_KEY }`})
              {`\n\n`}<span className="code-key">const</span> inspection = <span className="code-key">await</span> renovo.inspections.create({`{`}
              {`\n  type: `}<span className="code-str">&apos;checkout&apos;</span>,
              {`\n  tenancy_ref: `}<span className="code-str">&apos;RPT-448291&apos;</span>,
              {`\n  property: { address_line_1: `}<span className="code-str">&apos;42 Leith Walk&apos;</span>, postcode: <span className="code-str">&apos;EH6 5PY&apos;</span> {`},`}
              {`\n  deposit_pence: `}<span className="code-num">110000</span>,
              {`\n  scheme: `}<span className="code-str">&apos;sds&apos;</span>,
              {`\n  rooms: [ `}<span className="code-comment">{`/* ... */`}</span>{` ],`}
              {`\n  photos: [ `}<span className="code-comment">{`/* ... */`}</span>{` ],`}
              {`\n}, { idempotencyKey: `}<span className="code-str">&apos;chk_01HSV3...&apos;</span> {`})`}
              {`\n\n`}<span className="code-comment">{`// → { inspection_id: 'ins_01HSV3...',`}</span>
              {`\n`}<span className="code-comment">{`//     case_url: 'https://app.renovoai.co.uk/c/CHK-2026-482' }`}</span>
            </pre>

            <pre className="code-body code-body-pane" data-lang-pane="python">
              <span className="code-comment"># Push a checkout from your inventory system</span>
              {`\n`}<span className="code-key">from</span> renovo <span className="code-key">import</span> Renovo
              {`\n\nrenovo = Renovo(api_key=os.environ[`}<span className="code-str">&quot;RENOVO_API_KEY&quot;</span>{`])`}
              {`\n\ninspection = renovo.inspections.create(`}
              {`\n    type=`}<span className="code-str">&quot;checkout&quot;</span>,
              {`\n    tenancy_ref=`}<span className="code-str">&quot;RPT-448291&quot;</span>,
              {`\n    property={`}<span className="code-str">&quot;address_line_1&quot;</span>: <span className="code-str">&quot;42 Leith Walk&quot;</span>, <span className="code-str">&quot;postcode&quot;</span>: <span className="code-str">&quot;EH6 5PY&quot;</span>{`},`}
              {`\n    deposit_pence=`}<span className="code-num">110000</span>,
              {`\n    scheme=`}<span className="code-str">&quot;sds&quot;</span>,
              {`\n    rooms=[ `}<span className="code-comment"># ...</span>{` ],`}
              {`\n    photos=[ `}<span className="code-comment"># ...</span>{` ],`}
              {`\n    idempotency_key=`}<span className="code-str">&quot;chk_01HSV3...&quot;</span>,
              {`\n)`}
              {`\n\n`}<span className="code-comment"># → inspection.id       = &apos;ins_01HSV3...&apos;</span>
              {`\n`}<span className="code-comment"># → inspection.case_url = &apos;https://app.renovoai.co.uk/c/CHK-2026-482&apos;</span>
            </pre>

            <pre className="code-body code-body-pane" data-lang-pane="ruby">
              <span className="code-comment"># Push a checkout from your inventory system</span>
              {`\n`}<span className="code-key">require</span> <span className="code-str">&apos;renovo&apos;</span>
              {`\n\nRenovo.api_key = ENV[`}<span className="code-str">&apos;RENOVO_API_KEY&apos;</span>{`]`}
              {`\n\ninspection = Renovo::Inspection.create(`}
              {`\n  {`}
              {`\n    type: `}<span className="code-str">&apos;checkout&apos;</span>,
              {`\n    tenancy_ref: `}<span className="code-str">&apos;RPT-448291&apos;</span>,
              {`\n    property: { address_line_1: `}<span className="code-str">&apos;42 Leith Walk&apos;</span>, postcode: <span className="code-str">&apos;EH6 5PY&apos;</span> {`},`}
              {`\n    deposit_pence: `}<span className="code-num">110000</span>,
              {`\n    scheme: `}<span className="code-str">&apos;sds&apos;</span>,
              {`\n    rooms: [ `}<span className="code-comment"># ...</span>{` ],`}
              {`\n    photos: [ `}<span className="code-comment"># ...</span>{` ]`}
              {`\n  },`}
              {`\n  idempotency_key: `}<span className="code-str">&apos;chk_01HSV3...&apos;</span>
              {`\n)`}
              {`\n\n`}<span className="code-comment"># → inspection.id       # &apos;ins_01HSV3...&apos;</span>
              {`\n`}<span className="code-comment"># → inspection.case_url # &apos;https://app.renovoai.co.uk/c/CHK-2026-482&apos;</span>
            </pre>
          </div>
        </div>

        <p className="kicker" style={{ marginTop: 64 }}>
          Webhook events
        </p>
        <div className="wh-events">
          {webhookEvents.map((e) => (
            <div key={e} className="wh-event">
              {e}
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Want full API docs?</h3>
            <p className="cta-lite-sub">
              Sandbox access is open to any team. No commercial commitment needed to evaluate.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Request access →
            </Link>
            <Link href="/integrations" className="btn-outline">
              See integrations
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
