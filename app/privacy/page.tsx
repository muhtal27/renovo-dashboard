import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Privacy policy. Renovo AI',
  description:
    'Renovo AI Ltd is registered with the ICO (ZC112030). We act as your data processor under the UK GDPR and the Data Protection Act 2018.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <MarketingShell currentPath="/privacy">
      <section className="page-hero">
        <p className="kicker">Privacy policy</p>
        <h1>
          How we look after
          <br />
          <span className="accent">your tenancy data.</span>
        </h1>
        <p className="page-hero-sub">
          Renovo AI Ltd is registered with the ICO (ZC112030). We act as your data processor under the UK GDPR and the Data Protection Act 2018. You stay the data controller for all tenancy, landlord, and tenant information in your workspace.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">What we collect</div>
            <h3>Workspace data, account data, usage data.</h3>
            <p>
              Everything you put into a case file: tenant names, tenancy addresses, checkout reports, photographs, landlord correspondence, deposit figures. Account data for the letting agents using Renovo: name, work email, role. Usage data: pages visited, features used, timings, errors, for debugging and product improvement.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Lawful basis</div>
            <h3>Contract and legitimate interests.</h3>
            <p>
              We process your workspace data on the basis of your contract with us. We process account and usage data on the basis of our legitimate interest in running a stable, secure, improving product. Marketing comms, if any, are only sent on the basis of your explicit consent.
            </p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 16 }}>
          <div className="content-card">
            <div className="content-k">Your rights</div>
            <h3>Access, erasure, portability, objection.</h3>
            <p>
              You can ask for a copy of any personal data we hold, ask us to correct or delete it, or take a portable copy with you. Send a request to{' '}
              <a href="mailto:compliance@renovoai.co.uk" style={{ color: 'var(--em-300)' }}>
                compliance@renovoai.co.uk
              </a>{' '}
              with the subject line &lsquo;Data subject request&rsquo;. We respond inside one calendar month as required by the UK GDPR.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Retention and deletion</div>
            <h3>Three years default. Ninety days on exit.</h3>
            <p>
              Workspace data is kept for three years after the tenancy closes, so you can defend an adjudication outcome if it is reopened. Enterprise customers can configure longer periods. When a customer closes their account, workspace data is deleted within ninety days unless a longer period is required by law.
            </p>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Who processes your data</div>
          <h3>A short, auditable list.</h3>
          <div className="content-list">
            <div className="content-li">Supabase (AWS, eu-west-2) for database and storage.</div>
            <div className="content-li">Vercel (London edge) for frontend hosting.</div>
            <div className="content-li">Anthropic and AWS Bedrock for AI inference, with a zero-retention agreement.</div>
            <div className="content-li">Resend for transactional email. Stripe UK for billing.</div>
            <div className="content-li">No tenant PII is ever used to train any model.</div>
          </div>
          <div className="content-contact">
            <a href="mailto:compliance@renovoai.co.uk">compliance@renovoai.co.uk</a> for any privacy or data protection question.
          </div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Procurement team has a DPIA template?</h3>
            <p className="cta-lite-sub">We keep a pre-filled one ready to send. Ask the security team directly.</p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:security@renovoai.co.uk" className="btn-primary">
              Email security
            </a>
            <Link href="/security" className="btn-outline">
              See security
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
