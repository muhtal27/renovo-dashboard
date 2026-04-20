import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Investors. Renovo AI',
  description:
    'Pre seed. Disciplined scope. UK letting agencies handle roughly four million tenancies a year through fragmented checkout admin.',
  path: '/investors',
})

export default function InvestorsPage() {
  return (
    <MarketingShell currentPath="/investors">
      <section className="page-hero">
        <p className="kicker">Investors</p>
        <h1>
          Pre seed.
          <br />
          <span className="accent">Disciplined scope.</span>
        </h1>
        <p className="page-hero-sub">
          UK letting agencies handle roughly four million tenancies a year through fragmented checkout admin. Outcomes depend heavily on the completeness of the evidence pack when a dispute reaches the scheme. Renovo solves that narrow, defensible workflow. Not the whole property stack.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">Thesis</div>
            <h3>The operating layer between checkout evidence and defensible deposit decisions.</h3>
            <p>
              Checkout is fragmented across reports, photos, and email. Liability assessments are inconsistent under time pressure as portfolios grow. Dispute outcomes depend on how complete the evidence pack is. Renovo solves the evidence to decision workflow, narrowly and well.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Differentiation</div>
            <h3>Operator founded. Narrow scope. Manager controlled automation.</h3>
            <p>
              Built by founders with direct checkout review and claims preparation experience. Automation supports rather than replaces manager judgement. We deliberately do not build a broad property platform. A narrow scope compounds better over time.
            </p>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Stage and contact</div>
          <h3>Pre seed. Raising to expand distribution across UK schemes.</h3>
          <p>
            For diligence materials, data room access, or a founder intro call, email directly below. We respond inside one working day.
          </p>
          <div className="content-contact">
            <a href="mailto:investors@renovoai.co.uk">investors@renovoai.co.uk</a>
          </div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Want a product walkthrough before a call?</h3>
            <p className="cta-lite-sub">
              Book a demo as an investor. We will tailor it to thesis questions, not operator use cases.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a walkthrough →
            </Link>
            <a href="mailto:investors@renovoai.co.uk" className="btn-outline">
              Email direct
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
