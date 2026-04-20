import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Terms of service. Renovo AI',
  description:
    'Plain terms. Rolling monthly. These terms apply whenever you use Renovo, paid or free. Written to be read, not skimmed.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <MarketingShell currentPath="/terms">
      <section className="page-hero">
        <p className="kicker">Terms of service</p>
        <h1>
          Plain terms.
          <br />
          <span className="accent">Rolling monthly.</span>
        </h1>
        <p className="page-hero-sub">
          These terms apply whenever you use Renovo, paid or free. They are written to be read, not skimmed. If anything is unclear, email hello@renovoai.co.uk before you sign up.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">Who we are</div>
            <h3>Renovo AI Ltd, a Scottish company.</h3>
            <p>
              Registered as Renovo AI Ltd (SC833544) with VAT number GB483379648 and ICO registration ZC112030. Registered office in Edinburgh.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">What you get</div>
            <h3>Access to the Renovo workspace.</h3>
            <p>
              An operator workspace that ingests checkout evidence, drafts liability assessments, supports manager review, and produces scheme-ready deposit decisions. Subject to fair use and the plan you are on.
            </p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 16 }}>
          <div className="content-card">
            <div className="content-k">Billing</div>
            <h3>Monthly, in advance, plus VAT.</h3>
            <p>
              Free plan is free. Portfolio 365 is £179 per block per calendar month plus VAT. Enterprise is on a signed order form. First month on Portfolio 365 is complimentary for new customers. Billing runs on Stripe UK.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Cancellation</div>
            <h3>Any time, no notice period.</h3>
            <p>
              Cancel from inside the workspace at any point. We stop billing from the next cycle. Your data stays accessible for export up to ninety days. No refunds on the current paid month.
            </p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 16 }}>
          <div className="content-card">
            <div className="content-k">Acceptable use</div>
            <h3>Use Renovo to run end of tenancy operations.</h3>
            <p>
              Do not use the service to break UK law, harass tenants, or generate misleading adjudication bundles. Do not attempt to reverse engineer the AI models or scrape other customers&apos; data. Breach of this clause can lead to immediate termination.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Liability</div>
            <h3>Capped at fees paid in the last twelve months.</h3>
            <p>
              Renovo is a tool. Every deduction decision is signed off by a human manager at your agency. You remain responsible for the accuracy of tenancy data, for the decisions you take on the basis of it, and for adjudication outcomes. Our total liability is limited to the fees you paid us in the twelve months before a claim.
            </p>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Governing law</div>
          <h3>Scotland, UK.</h3>
          <p>
            These terms are governed by the laws of Scotland. Disputes are resolved in the Scottish courts. Nothing in these terms affects your statutory rights as a UK consumer, if that applies to you.
          </p>
          <div className="content-contact">Last updated 18 April 2026. Previous versions on request.</div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Need a signed order form or master agreement?</h3>
            <p className="cta-lite-sub">Enterprise customers sign a standard MSA and DPA. Email the team below.</p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:hello@renovoai.co.uk" className="btn-primary">
              Email us
            </a>
            <Link href="/pricing" className="btn-outline">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
