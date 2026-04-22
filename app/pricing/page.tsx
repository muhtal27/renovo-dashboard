import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Pricing. Renovo AI',
  description:
    'Transparent, stackable pricing. Portfolio 365 at £179 per block per month for up to 365 tenancies, or Enterprise for multi branch groups. Monthly rolling, cancel whenever you like.',
  path: '/pricing',
})

type Tier = {
  featured?: boolean
  name: string
  tag: string
  priceAmount: string
  pricePer?: string
  priceAlt: string
  ctaLabel: string
  featHead: string
  features: string[]
}

const tiers: Tier[] = [
  {
    featured: true,
    name: 'Portfolio 365',
    tag: 'For fully managed portfolios',
    priceAmount: '£179',
    pricePer: '/ block / month + VAT',
    priceAlt: 'Up to 365 fully managed tenancies per block. Stack as you grow.',
    ctaLabel: 'Book a demo →',
    featHead: 'Everything you need',
    features: [
      'Full case workspace and evidence management',
      'AI drafted liability assessments',
      'Approval workflows and audit trail',
      'Dispute pack generation (PDF)',
      'Scheme submission (TDS, DPS, mydeposits, SDS)',
      'Unlimited users, no contract',
      'First month free',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    tag: '5+ blocks (1,825+ tenancies)',
    priceAmount: 'Custom',
    priceAlt: 'Multi branch groups. Custom integrations. Dedicated onboarding.',
    ctaLabel: 'Talk to sales →',
    featHead: 'Everything in Portfolio 365, plus',
    features: [
      'Single sign on via Microsoft Entra ID',
      'Custom data retention',
      'Custom integrations and API access',
      'Named account manager and SLA',
      'Security review pack on request',
    ],
  },
]

const faqs = [
  {
    q: 'What counts as a tenancy?',
    a: "An active fully managed tenancy your agency holds on its rent roll. Let-only tenancies aren't counted — you only pay for cases where Renovo handles end-of-tenancy work.",
  },
  {
    q: 'How does the block system work?',
    a: 'One block covers up to 365 fully managed tenancies at £179/month. Add blocks as you grow. No overages, no surprise invoices — if you need another block, we agree it first.',
  },
  {
    q: 'When do I move to Enterprise?',
    a: 'Usually around 5+ blocks (1,825 tenancies), or whenever you need SSO, custom integrations, a named account manager, or a formal SLA.',
  },
  {
    q: 'What about contracts?',
    a: 'Monthly rolling by default. Cancel whenever you like — no exit fees, no notice period, your data is exported on request.',
  },
]

export default function PricingPage() {
  const rangeFieldStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 180,
    accentColor: 'var(--em-500)',
    height: 4,
  }
  const kickerMono: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(255,255,255,.5)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  }
  const bigMono: React.CSSProperties = {
    fontSize: 22,
    color: '#fff',
    fontWeight: 600,
    marginTop: 4,
  }

  return (
    <MarketingShell currentPath="/pricing">
      <section className="page-hero">
        <p className="kicker">Pricing</p>
        <h1 className="reveal">
          Transparent. Stackable.
          <br />
          <span className="accent">No setup fees, no contracts.</span>
        </h1>
        <p className="page-hero-sub reveal reveal-d1">
          Fully managed tenancies scale in blocks of 365. Add more as your portfolio grows. Prices exclude VAT. Monthly rolling, cancel whenever you like.
        </p>
      </section>

      <section className="section first">
        <div className="pricing-grid reveal reveal-d2">
          {tiers.map((t) => (
            <div key={t.name} className={`tier${t.featured ? ' featured' : ''}`}>
              {t.featured && <span className="tier-ribbon">Most popular</span>}
              <div className="tier-name">{t.name}</div>
              <div className="tier-tag">{t.tag}</div>
              <div className="tier-price">
                <span className="amt mono tabnum">{t.priceAmount}</span>
                {t.pricePer && <span className="per">{t.pricePer}</span>}
              </div>
              <div className="tier-price-alt">{t.priceAlt}</div>
              <Link href="/book-demo" className="tier-cta">
                {t.ctaLabel}
              </Link>
              <div className="tier-divider" />
              <div className="tier-feat-head">{t.featHead}</div>
              <div className="tier-features">
                {t.features.map((f) => (
                  <div key={f} className="tier-feat">
                    <span className="tier-feat-icon">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Block calculator — bound by MarketingClientEffects via IDs */}
        <div
          className="content-card reveal reveal-d3"
          style={{ maxWidth: 880, margin: '32px auto 0', padding: 28 }}
        >
          <div className="content-k">Block calculator</div>
          <h3>Size your plan.</h3>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginTop: 6 }}>
            Drag to see how Portfolio 365 scales across your fully managed tenancies.
          </p>
          <div
            style={{
              marginTop: 22,
              display: 'grid',
              gap: 20,
              gridTemplateColumns: '1fr',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ ...kickerMono, minWidth: 80 }}>Blocks</span>
              <input
                type="range"
                id="pricing-calc-blocks"
                min={1}
                max={10}
                defaultValue={2}
                style={rangeFieldStyle}
                aria-label="Number of blocks"
              />
              <span
                id="pricing-calc-blocks-n"
                className="mono tabnum"
                style={{ color: 'var(--em-300)', fontWeight: 600, fontSize: 18, minWidth: 50, textAlign: 'right' }}
              >
                2
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={kickerMono}>Tenancies</div>
                <div id="pricing-calc-tenancies" className="mono tabnum" style={bigMono}>
                  730
                </div>
              </div>
              <div>
                <div style={kickerMono}>Monthly</div>
                <div
                  id="pricing-calc-monthly"
                  className="mono tabnum"
                  style={{ ...bigMono, color: 'var(--em-300)' }}
                >
                  £358
                </div>
              </div>
              <div>
                <div style={kickerMono}>Per tenancy</div>
                <div id="pricing-calc-per" className="mono tabnum" style={bigMono}>
                  £0.49
                </div>
              </div>
              <div>
                <div style={kickerMono}>Annual</div>
                <div id="pricing-calc-annual" className="mono tabnum" style={bigMono}>
                  £4,296
                </div>
              </div>
            </div>
            <div
              id="pricing-calc-note"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,.5)',
                paddingTop: 8,
                borderTop: '1px solid rgba(255,255,255,.05)',
              }}
            >
              Plus VAT. Monthly rolling, cancel whenever you like. First month free on new accounts.
            </div>
          </div>
        </div>

        <div className="pricing-note reveal reveal-d4">
          Worked example. A five block portfolio (around 1,825 fully managed tenancies) comes to £895 per month plus VAT. Move up to Enterprise when you need custom integrations or a named account manager.
        </div>
      </section>

      <section className="section">
        <p className="kicker">FAQ</p>
        <h2>Pricing questions, answered plainly.</h2>
        <div className="content-grid reveal" style={{ marginTop: 24 }}>
          {faqs.map((f) => (
            <div key={f.q} className="content-card">
              <h3>{f.q}</h3>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>See it on your tenancies.</h3>
            <p className="cta-lite-sub">Book a demo and we&apos;ll walk your team through a live case.</p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <Link href="/" className="btn-outline">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
