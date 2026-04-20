import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Complaints procedure. Renovo AI',
  description:
    'Something gone wrong? Tell us directly. We take every complaint seriously — platform, billing, support, or data handling.',
  path: '/complaints',
})

export default function ComplaintsPage() {
  return (
    <MarketingShell currentPath="/complaints">
      <section className="page-hero">
        <p className="kicker">Complaints procedure</p>
        <h1>
          Something gone wrong?
          <br />
          <span className="accent">Tell us directly.</span>
        </h1>
        <p className="page-hero-sub">
          We take every complaint seriously, whether it is about the platform, a billing issue, a support experience, or a data handling concern. This page sets out how to raise one, what we will do, and how long it will take.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">Step one</div>
            <h3>Email us with the details.</h3>
            <p>
              Send your complaint to{' '}
              <a href="mailto:complaints@renovoai.co.uk" style={{ color: 'var(--em-300)' }}>
                complaints@renovoai.co.uk
              </a>
              . Include your agency name, your role, what went wrong, when it happened, and the outcome you would like.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Step two</div>
            <h3>We acknowledge inside two working days.</h3>
            <p>
              A member of the team will confirm we have received the complaint, tell you who owns it at Renovo, and give you a reference number. We will come back with follow up questions if we need them.
            </p>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 16 }}>
          <div className="content-card">
            <div className="content-k">Step three</div>
            <h3>Full response inside ten working days.</h3>
            <p>
              We will investigate, set out our findings in writing, and propose a resolution. If we have got it wrong, we will say so, put it right, and tell you what we are doing to stop it happening again.
            </p>
          </div>
          <div className="content-card">
            <div className="content-k">Still not happy?</div>
            <h3>Escalate to the founder team.</h3>
            <p>
              If the outcome does not resolve the issue, write to{' '}
              <a
                href="mailto:complaints@renovoai.co.uk?subject=Complaint%20escalation"
                style={{ color: 'var(--em-300)' }}
              >
                complaints@renovoai.co.uk
              </a>{' '}
              with &lsquo;Complaint escalation&rsquo; in the subject. A founder will review within five working days. This is the final internal stage.
            </p>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Data protection complaints</div>
          <h3>You can also go to the ICO.</h3>
          <p>
            If your complaint is about how we handle personal data and you are not satisfied with our response, you have the right to raise it with the Information Commissioner&apos;s Office at{' '}
            <a href="https://ico.org.uk" target="_blank" rel="noopener" style={{ color: 'var(--em-300)' }}>
              ico.org.uk
            </a>
            . Doing that does not affect any other legal rights you have.
          </p>
          <div className="content-contact">Complaints procedure last reviewed 18 April 2026.</div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Prefer to raise a feature request instead?</h3>
            <p className="cta-lite-sub">
              Not every frustration is a complaint. Product feedback goes to the same email, no reference number needed.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:hello@renovoai.co.uk?subject=Feature%20request" className="btn-primary">
              Email feedback
            </a>
            <Link href="/contact" className="btn-outline">
              Other contacts
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
