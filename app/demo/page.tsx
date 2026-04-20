import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Interactive demo. Renovo AI',
  description:
    'Explore the full operator dashboard with live mock data. Nine Edinburgh tenancies, every sidebar page interactive, no real customer data.',
  path: '/demo',
})

const workflowCards = [
  {
    kicker: 'Draft to resolved',
    title: 'Every step, end to end.',
    body: 'Document upload, AI defect detection, manager review, draft delivery, scheme submission, and dispute pack generation. Complete a case start to finish.',
  },
  {
    kicker: 'Every page',
    title: "The operator's actual view.",
    body: 'Checkouts, Disputes, Guidance, Reports, Admin, Teams, and Settings — exactly how a property manager sees them in the live workspace. Nothing mocked at the UI level.',
  },
  {
    kicker: 'Mock data',
    title: 'Nine Edinburgh tenancies.',
    body: 'Properties, tenants, landlords, deposits, and AI-generated liability assessments across every workflow state — intake, review, draft, sent, paid, and disputed.',
  },
]

export default function DemoPage() {
  return (
    <MarketingShell currentPath="/demo">
      <section className="page-hero">
        <p className="kicker">Interactive demo</p>
        <h1>
          Explore the full operator dashboard
          <br />
          <span className="accent">with live mock data.</span>
        </h1>
        <p className="page-hero-sub">
          Walk the end of tenancy workflow from checkout intake through AI analysis, manager review, draft delivery, and claim submission. Every sidebar page is fully interactive. Nine mock Edinburgh properties, no real customer data.
        </p>
        <div className="hero-ctas">
          <a href="/demo.html" className="btn-primary btn-lg">
            Launch interactive demo <span>→</span>
          </a>
          <Link href="/book-demo" className="btn-outline">
            Book a guided walkthrough
          </Link>
        </div>
      </section>

      <section className="section first">
        <p className="kicker">Full workflow</p>
        <h2>
          Draft to resolved,
          <br />
          <span className="accent">in one workspace.</span>
        </h2>
        <div className="content-grid">
          {workflowCards.map((c) => (
            <div key={c.kicker} className="content-card">
              <div className="content-k">{c.kicker}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Prefer a live walkthrough?</h3>
            <p className="cta-lite-sub">
              Bring an anonymised checkout from a live tenancy. We&apos;ll process it on the call with someone who has managed a UK letting portfolio.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <a href="/demo.html" className="btn-outline">
              Launch interactive demo
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
