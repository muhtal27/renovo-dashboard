import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Compliance. Renovo AI',
  description:
    'UK registered. UK hosted. UK audited. A short, factual summary of our regulatory standing and the technical controls we run.',
  path: '/compliance',
})

export default function CompliancePage() {
  return (
    <MarketingShell currentPath="/compliance">
      <section className="page-hero">
        <p className="kicker">Compliance</p>
        <h1>
          UK registered.
          <br />
          <span className="accent">UK hosted. UK audited.</span>
        </h1>
        <p className="page-hero-sub">
          A short, factual summary of our regulatory standing and the technical controls we run. For deeper detail, see the Security page or email the security team directly.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">Company standing</div>
            <h3>Scottish limited company, ICO registered.</h3>
            <div className="content-list">
              <div className="content-li">Renovo AI Ltd, company number SC833544.</div>
              <div className="content-li">VAT registered, number GB483379648.</div>
              <div className="content-li">ICO data controller, reference ZC112030.</div>
              <div className="content-li">Registered office in Edinburgh.</div>
            </div>
          </div>
          <div className="content-card">
            <div className="content-k">Data protection</div>
            <h3>UK GDPR and Data Protection Act 2018.</h3>
            <div className="content-list">
              <div className="content-li">You are the controller, we are your processor.</div>
              <div className="content-li">Signed DPA available on request, no extra charge.</div>
              <div className="content-li">Data subject requests handled inside one month.</div>
              <div className="content-li">Pre-filled DPIA template available for procurement.</div>
            </div>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 16 }}>
          <div className="content-card">
            <div className="content-k">Hosting</div>
            <h3>London and nowhere else.</h3>
            <div className="content-list">
              <div className="content-li">Supabase on AWS eu-west-2 (London).</div>
              <div className="content-li">Vercel frontend routed through the London edge.</div>
              <div className="content-li">Automated daily backups in the same region.</div>
              <div className="content-li">Point-in-time recovery for 35 days.</div>
            </div>
          </div>
          <div className="content-card">
            <div className="content-k">Access and authentication</div>
            <h3>SSO, role-based permissions, session timeouts.</h3>
            <div className="content-list">
              <div className="content-li">Enterprise SSO via Microsoft Entra ID.</div>
              <div className="content-li">Operators see assigned cases; managers see portfolio.</div>
              <div className="content-li">Sessions auto-expire after inactivity.</div>
              <div className="content-li">Least-privilege API tokens for integrations.</div>
            </div>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Audit and retention</div>
          <h3>Every action logged. Three years retention.</h3>
          <div className="content-list">
            <div className="content-li">Every edit, approval, and export is timestamped and attributed.</div>
            <div className="content-li">Audit records are immutable inside the workspace.</div>
            <div className="content-li">Three years standard retention, custom on Enterprise.</div>
            <div className="content-li">Ninety days to deletion after contract end, unless law requires longer.</div>
          </div>
          <div className="content-contact">
            Full policy language in the <Link href="/privacy">Privacy Policy</Link>. Signed DPA on request from{' '}
            <a href="mailto:compliance@renovoai.co.uk">compliance@renovoai.co.uk</a>.
          </div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Running a procurement review?</h3>
            <p className="cta-lite-sub">
              We turn round security questionnaires the same working day for Portfolio 365 and Enterprise customers.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:compliance@renovoai.co.uk" className="btn-primary">
              Email compliance
            </a>
            <Link href="/security" className="btn-outline">
              Technical detail
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
