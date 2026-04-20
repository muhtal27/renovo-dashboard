import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Insights. Renovo AI',
  description:
    'Coming soon. Market research, product updates, and practical analysis for operations teams.',
  path: '/insights',
})

export default function InsightsPage() {
  return (
    <MarketingShell currentPath="/insights">
      <section className="page-hero">
        <p className="kicker">Insights</p>
        <h1>
          Coming soon.
          <br />
          <span className="accent">The UK end of tenancy landscape.</span>
        </h1>
        <p className="page-hero-sub">
          We are preparing our first set of insights. Market research, product updates, and practical analysis for operations teams. Check back shortly, or join the short list to hear when the first piece goes out.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">What&apos;s coming</div>
            <h3>Three content threads.</h3>
            <div className="content-list">
              <div className="content-li">
                <strong>Market research.</strong> Benchmarks on dispute rates, adjudication award patterns, and time to resolve across UK schemes.
              </div>
              <div className="content-li">
                <strong>Product updates.</strong> Every new connector, workflow step, and model improvement shipped in the previous quarter.
              </div>
              <div className="content-li">
                <strong>Operational analysis.</strong> Practical playbooks for property managers. Fair wear tables, evidence standards, deduction reasoning.
              </div>
            </div>
          </div>
          <div className="content-card">
            <div className="content-k">Notified first</div>
            <h3>Want an early copy?</h3>
            <p>
              Book a demo (even a short one) and we&apos;ll add you to the pre-release list. The first insight piece ships shortly with embargoed access for early subscribers.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/book-demo" className="btn-primary">
                Book a demo →
              </Link>
              <a href="mailto:hello@renovoai.co.uk?subject=Insights%20list" className="btn-outline">
                Email to subscribe
              </a>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
