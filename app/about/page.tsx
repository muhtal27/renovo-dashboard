import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'About. Renovo AI',
  description:
    'Renovo is the operating layer between checkout evidence and defensible deposit decisions. Narrow scope, on purpose.',
  path: '/about',
})

const principles = [
  {
    num: '01',
    title: 'AI assists, humans decide.',
    body: 'The system drafts. Every liability assessment, every deduction, every letter needs a named manager to approve it. Nothing sends itself. No silent state changes. No AI signing off on anything that ends up in front of a tenant.',
  },
  {
    num: '02',
    title: 'Built for operational use.',
    body: 'Developed around real portfolio pressures. Volume, timing, staff turnover. Not theoretical scenarios. The founding team manages end of tenancy for live residential lettings portfolios.',
  },
  {
    num: '03',
    title: 'Defensible output matters.',
    body: 'Every decision has to survive the scheme. Evidence, proportionality, audit trails, and scheme ready language are not optional extras. They are the product.',
  },
]

export default function AboutPage() {
  return (
    <MarketingShell currentPath="/about">
      <section className="page-hero">
        <p className="kicker">About</p>
        <h1>
          Built by a team that runs
          <br />
          <span className="accent">end of tenancy operations.</span>
        </h1>
        <p className="page-hero-sub">
          Renovo is the operating layer between checkout evidence and defensible deposit decisions. We chose a narrow scope on purpose. We solve one workflow, thoroughly, rather than building a broad property platform.
        </p>
      </section>

      <section className="section first">
        <div className="about-grid">
          {principles.map((p) => (
            <div key={p.num} className="about-card">
              <div className="about-card-num">{p.num}</div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>We&apos;d rather show you than tell you.</h3>
            <p className="cta-lite-sub">
              Send us an anonymised checkout. We&apos;ll run it live with someone who&apos;s managed a UK letting portfolio.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <Link href="/" className="btn-outline">
              See the product
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
