import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Contact. Renovo AI',
  description:
    'No ticket systems, no round robin. Messages go straight to the relevant team member and we reply inside one working day.',
  path: '/contact',
})

const channels = [
  { k: 'General', email: 'hello@renovoai.co.uk', d: 'Product, partnerships, enquiries' },
  { k: 'Investors', email: 'investors@renovoai.co.uk', d: 'Pre seed stage' },
  { k: 'Compliance', email: 'compliance@renovoai.co.uk', d: 'Data protection, DPA, DPIA' },
  { k: 'Security', email: 'security@renovoai.co.uk', d: 'Responsible disclosure' },
  { k: 'Complaints', email: 'complaints@renovoai.co.uk', d: 'Formal complaints procedure' },
  { k: 'Careers', email: 'careers@renovoai.co.uk', d: 'Get in touch even without an open role' },
]

export default function ContactPage() {
  return (
    <MarketingShell currentPath="/contact">
      <section className="page-hero">
        <p className="kicker">Contact</p>
        <h1>
          Get in touch.
          <br />
          <span className="accent">We reply directly.</span>
        </h1>
        <p className="page-hero-sub">
          No ticket systems, no round robin. Messages go straight to the relevant team member and we reply inside one working day.
        </p>
      </section>

      <section className="section first">
        <div className="contact-band">
          {channels.map((c) => (
            <div key={c.k} className="contact-col">
              <span className="contact-k">{c.k}</span>
              <a href={`mailto:${c.email}`} className="contact-v">
                {c.email}
              </a>
              <span className="contact-d">{c.d}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            padding: '24px 28px',
            border: '1px solid rgba(255,255,255,.06)',
            background: 'rgba(255,255,255,.02)',
            borderRadius: 18,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,.4)',
            }}
          >
            Registered address
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.8 }}>
            Renovo AI Ltd · Edinburgh, Scotland
            <br />
            Company no. SC833544 · VAT GB483379648 · ICO ZC112030
          </div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Prefer a live demo?</h3>
            <p className="cta-lite-sub">Book a 30 minute walkthrough. Confirmation inside one working day.</p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <a href="mailto:hello@renovoai.co.uk" className="btn-outline">
              Email direct
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
