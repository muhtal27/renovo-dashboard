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

export default function PricingPage() {
  return (
    <MarketingShell currentPath="/pricing">
      <section className="page-hero">
        <p className="kicker">Pricing</p>
        <h1>
          Transparent. Stackable.
          <br />
          <span className="accent">No setup fees, no contracts.</span>
        </h1>
        <p className="page-hero-sub">
          Fully managed tenancies scale in blocks of 365. Add more as your portfolio grows. Prices exclude VAT. Monthly rolling, cancel whenever you like.
        </p>
      </section>

      <section className="section first">
        <div className="pricing-grid">
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

        <div className="pricing-note">
          Worked example. A five block portfolio (around 1,825 fully managed tenancies) comes to £895 per month plus VAT. Move up to Enterprise when you need custom integrations or a named account manager.
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
