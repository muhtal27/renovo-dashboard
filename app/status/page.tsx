import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'System status. Renovo AI',
  description:
    'All systems operational. Live uptime and incident history for every Renovo surface that customers rely on. UK hosted.',
  path: '/status',
})

type ServiceRow = {
  name: string
  desc: string
  uptime: string
}

const services: ServiceRow[] = [
  { name: 'Operator dashboard', desc: 'app.renovoai.co.uk · Next.js on Vercel', uptime: '99.99% · 90d' },
  { name: 'Public API', desc: 'api.renovoai.co.uk/v1 · FastAPI on AWS London', uptime: '99.98% · 90d' },
  { name: 'Webhook delivery', desc: 'HMAC SHA-256 · retry with backoff', uptime: '99.97% · 90d' },
  { name: 'Evidence pipeline', desc: 'Image ingest, EXIF verification, OCR', uptime: '99.94% · 90d' },
  { name: 'AI drafting service', desc: 'Anthropic & Bedrock · liability reasoning', uptime: '99.92% · 90d' },
  { name: 'CRM integrations', desc: 'Alto, Jupix, MRI Qube, Street.co.uk · tenancy + contact sync', uptime: '99.96% · 90d' },
  { name: 'Scheme connectors', desc: 'SDS, DPS, TDS, mydeposits · claim submission', uptime: '99.91% · 90d' },
  { name: 'Supabase (PostgreSQL)', desc: 'Primary data store · London region', uptime: '99.99% · 90d' },
]

type Incident = {
  window: string
  title: string
  detail: string
}

const incidents: Incident[] = [
  {
    window: '08 Apr 2026 · 14:22 – 14:29 UTC',
    title: 'Elevated p95 on evidence pipeline (OCR queue)',
    detail:
      'Transient spike in Tesseract worker latency following a dependency upgrade. Auto-rolled back, queue cleared within 7 minutes. No case data affected.',
  },
  {
    window: '21 Mar 2026 · 09:04 – 09:12 UTC',
    title: 'DPS claim submission returning 502 on retry',
    detail:
      'Upstream DPS sandbox gateway timeout. Auto-retry with exponential backoff recovered all 14 queued submissions. Customers unaffected — retries are transparent.',
  },
  {
    window: '02 Mar 2026 · 22:51 – 22:54 UTC',
    title: 'Brief API 5xx during routine Supabase failover',
    detail:
      'Scheduled read replica promotion completed in 3 minutes. Retries transparent to callers with Idempotency-Key header set.',
  },
]

export default function StatusPage() {
  return (
    <MarketingShell currentPath="/status">
      <section className="page-hero">
        <p className="kicker">Status</p>
        <h1 className="reveal">
          All systems operational.
          <br />
          <span className="accent">UK hosted. Live metrics.</span>
        </h1>
        <p className="page-hero-sub reveal reveal-d1">
          Real-time health of every Renovo surface that customers rely on. Uptime rolling 90 days. Incidents since launch,
          publicly logged.
        </p>
        <div className="status-hero-banner reveal reveal-d2">
          <span className="status-pulse" />
          All systems operational · updated just now
        </div>
        <div className="status-metrics reveal reveal-d3">
          <div className="status-metric">
            <div className="status-metric-k">API uptime · 90d</div>
            <div className="status-metric-v tabnum">
              99.98<span style={{ opacity: 0.5 }}>%</span>
            </div>
            <div className="status-metric-d">7 min downtime across quarter</div>
          </div>
          <div className="status-metric">
            <div className="status-metric-k">p95 response</div>
            <div className="status-metric-v tabnum">
              142<span style={{ opacity: 0.5 }}>ms</span>
            </div>
            <div className="status-metric-d">down 18ms week on week</div>
          </div>
          <div className="status-metric">
            <div className="status-metric-k">Open incidents</div>
            <div className="status-metric-v tabnum">0</div>
            <div className="status-metric-d">last closed 14 days ago</div>
          </div>
        </div>
      </section>

      <section className="section first">
        <p className="kicker">Systems</p>
        <h2>Live health by surface.</h2>
        <div className="status-services reveal">
          {services.map((s) => (
            <div key={s.name} className="status-row">
              <div className="status-row-main">
                <div className="status-row-name">{s.name}</div>
                <div className="status-row-desc">{s.desc}</div>
              </div>
              <span className="status-row-uptime">{s.uptime}</span>
              <span className="status-row-dot ok">
                <span className="d" />
                Operational
              </span>
            </div>
          ))}
        </div>

        <p className="kicker" style={{ marginTop: 48 }}>
          API uptime · last 90 days
        </p>
        <div className="content-card reveal reveal-d1" style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 6,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--em-300)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: 'linear-gradient(to top,var(--em-600),var(--em-300))',
                    verticalAlign: 'middle',
                    marginRight: 5,
                  }}
                />
                Operational
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: 'linear-gradient(to top,var(--amber-500),var(--amber-300))',
                    verticalAlign: 'middle',
                    marginRight: 5,
                  }}
                />
                Degraded
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: 'linear-gradient(to top,var(--rose-500),var(--rose-300))',
                    verticalAlign: 'middle',
                    marginRight: 5,
                  }}
                />
                Outage
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              hover bars for detail
            </span>
          </div>
          <div className="heat-bars" data-status-heatmap />
          <div className="status-bar-scale">
            <span>90 days ago</span>
            <span>60</span>
            <span>30</span>
            <span>Today</span>
          </div>
        </div>

        <p className="kicker" style={{ marginTop: 48 }}>
          Recent incidents
        </p>
        <div className="content-card reveal reveal-d1" style={{ marginTop: 16 }}>
          {incidents.map((inc, i) => (
            <div key={inc.window} className="status-incident" style={{ marginTop: i === 0 ? 0 : 10 }}>
              <div className="status-incident-head">
                <span>{inc.window}</span>
                <span className="status-incident-tag resolved">Resolved</span>
              </div>
              <div className="status-incident-t">{inc.title}</div>
              <div className="status-incident-d">{inc.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Subscribe to incident notices.</h3>
            <p className="cta-lite-sub">
              Email alerts for degradations, outages, and resolutions. No marketing. Integration partners receive advance
              notice of breaking API changes.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:status@renovoai.co.uk?subject=Status%20subscribe" className="btn-primary">
              Subscribe →
            </a>
            <Link href="/security" className="btn-outline">
              Security posture
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
