import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Security and compliance. Renovo AI',
  description:
    'UK hosted. Audit first. Humans decide. Every workspace is isolated at database level. Every action is timestamped and attributed.',
  path: '/security',
})

const badges = [
  { ic: 'GDPR', t: 'UK GDPR and DPA 2018', d: 'Full data subject rights. Access, erasure, and portability handled inside the statutory time limits.' },
  { ic: 'ICO', t: 'ICO registered', d: "Information Commissioner's Office registration ZC112030. Renewed every year." },
  { ic: 'UK', t: 'Data in London', d: 'Supabase on AWS eu-west-2. Vercel frontend routed through London edge. Automated daily backups.' },
  { ic: 'AES', t: 'Encrypted everywhere', d: 'TLS in transit, AES 256 at rest. Tokens, session credentials, and API keys use least privilege.' },
]

const pillars = [
  {
    title: 'Your data is yours.',
    body: 'You stay the data controller. We act as your processor. Tenancy data processed by AI is never used to train models and never shared outside Renovo.',
    items: [
      'Per workspace database isolation',
      'Three year default retention, custom on Enterprise',
      'Deletion inside 90 days of contract end',
    ],
  },
  {
    title: 'Every decision is logged.',
    body: 'Every AI draft, every manager edit, every liability reassignment is logged with actor, timestamp, and reason. Records cannot be edited or deleted inside the workspace.',
    items: [
      'Tamper evident case history',
      'Replayable to any point in time',
      'Exportable as a signed PDF for adjudication',
    ],
  },
  {
    title: 'Access is controlled.',
    body: 'Role based permissions with manager sign off. Property managers see their assigned cases. Branch managers see the whole portfolio. Sessions time out automatically. Enterprise customers use single sign on.',
    items: [
      'Single sign on via Microsoft Entra ID (Enterprise)',
      'Least privilege API tokens',
      'Responsible disclosure to security@renovoai.co.uk',
    ],
  },
]

export default function SecurityPage() {
  return (
    <MarketingShell currentPath="/security">
      <section className="page-hero">
        <p className="kicker">Security and compliance</p>
        <h1>
          UK hosted. Audit first.
          <br />
          <span className="accent">Humans decide.</span>
        </h1>
        <p className="page-hero-sub">
          Every workspace is isolated at database level. Every action is timestamped and attributed. Tenancy data processed by AI is never used for model training and never shared outside Renovo.
        </p>
      </section>

      <section className="section first">
        <div className="sec-badges">
          {badges.map((b) => (
            <div key={b.t} className="sec-badge">
              <div className="sec-badge-ic">{b.ic}</div>
              <div className="sec-badge-t">{b.t}</div>
              <div className="sec-badge-d">{b.d}</div>
            </div>
          ))}
        </div>

        <div className="sec-pillars">
          {pillars.map((p) => (
            <div key={p.title} className="sec-pillar">
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <div className="sec-pillar-list">
                {p.items.map((i) => (
                  <div key={i} className="sec-pillar-item">
                    {i}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sec-disclose">
          <div>
            <p className="k">Responsible disclosure</p>
            <div className="t">Found a vulnerability? Tell us directly.</div>
            <p className="d">
              Email{' '}
              <a
                href="mailto:security@renovoai.co.uk"
                style={{ color: 'var(--sky-300)', textDecoration: 'underline' }}
              >
                security@renovoai.co.uk
              </a>{' '}
              with the steps to reproduce, the affected endpoints, and the security impact. We triage inside four working hours and fix critical issues quickly.
            </p>
          </div>
          <a href="mailto:security@renovoai.co.uk" className="btn-outline">
            Email security team →
          </a>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Procurement review? Send your security team our way.</h3>
            <p className="cta-lite-sub">
              We return DPA, pre-filled questionnaire, and compliance details same-business-day for Portfolio 365+ customers.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:security@renovoai.co.uk" className="btn-primary">
              Email security team
            </a>
            <Link href="/book-demo" className="btn-outline">
              Book a technical demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
