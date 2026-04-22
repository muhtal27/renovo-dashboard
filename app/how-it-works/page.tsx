import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'How it works. Renovo AI',
  description:
    'Checkout to deposit release in one system. AI drafts the repeatable bits. Managers approve where judgement matters. Scheme ready at every step.',
  path: '/how-it-works',
})

const sixSteps = [
  {
    kicker: '01 · Automated intake',
    title: 'Case opened, checkout report ingested.',
    body: 'Alto, Jupix, MRI Qube, Street.co.uk, or a dropped PDF — the checkout pack lands in a new case with every photo, annotation, and condition score attached.',
  },
  {
    kicker: '02 · AI comparison',
    title: 'Check-in inventory vs checkout report.',
    body: 'Every room and every item matched across the two reports. Defects surfaced with location, severity, and the relevant photo exhibit ready for review.',
  },
  {
    kicker: '03 · AI draft',
    title: 'Liability assessment with proportionate reasoning.',
    body: 'Fair wear factor, tenancy length, check-in condition, and scheme precedent applied per defect. Costings anchored to your template rate card.',
  },
  {
    kicker: '04 · Manager review',
    title: 'Reviewed, amended, and approved.',
    body: 'Property managers accept, adjust, or override any line. The audit trail records what changed, who changed it, and why — scheme ready.',
  },
  {
    kicker: '05 · Resolution',
    title: 'Deposit released through the scheme.',
    body: 'Deduction letters sent from your own Outlook. Scheme portals updated through direct connectors to SDS, DPS, TDS, and mydeposits.',
  },
  {
    kicker: '06 · If disputed',
    title: 'Adjudication ready evidence pack.',
    body: 'Timeline, photos, reasoning, scheme precedent, and proportionality evidence assembled automatically. No more rebuilding the case from email threads.',
  },
]

const decisionControlCards = [
  {
    kicker: 'Human approval',
    title: 'No automated deposit decisions.',
    body: 'Every draft moves to a named property manager for review. Renovo never releases a deposit, sends a deduction letter, or submits a claim without an explicit human sign off.',
  },
  {
    kicker: 'Case level audit trail',
    title: 'Every edit captured. Nothing overwritten.',
    body: 'Who changed what, when, and why. AI reasoning, manager overrides, and scheme correspondence recorded in a single timeline. Defensible under adjudicator review.',
  },
  {
    kicker: 'Operational consistency',
    title: 'The same logic, across every case.',
    body: 'Fair wear factors, proportionality rules, and template language apply uniformly across branches and managers. New joiners produce scheme ready decisions from day one.',
  },
]

const systemHandoffCards = [
  {
    kicker: 'Inventory and inspection',
    title: 'Reports come in pre-structured.',
    body: 'InventoryBase, Inventory Hive, No Letting Go, and PDF fallback. Check-in vs checkout comparison happens in the background without retyping.',
  },
  {
    kicker: 'Property management',
    title: 'Tenancy data stays in your CRM.',
    body: 'Alto, Jupix, MRI Qube, and Street.co.uk two-way sync. Outcomes, deduction letters, and signed PDFs posted back as activity entries.',
  },
  {
    kicker: 'Claim and dispute',
    title: 'Scheme portals, one workflow.',
    body: 'SafeDeposits Scotland, DPS, TDS, and mydeposits. Adjudication bundles submitted without copying and pasting into four different portals.',
  },
]

export default function HowItWorksPage() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <section className="page-hero">
        <p className="kicker">How it works</p>
        <h1>
          From checkout report
          <br />
          <span className="accent">to deposit decision.</span>
        </h1>
        <p className="page-hero-sub">
          Renovo fits around the way UK letting agencies already manage end of tenancy. AI drafts the repeatable bits. Property managers approve where judgement matters. Scheme ready at every step.
        </p>
      </section>

      <section className="section first">
        <p className="kicker">Six steps</p>
        <h2>
          Checkout to deposit release,
          <br />
          in one system.
        </h2>
        <div className="content-grid">
          {sixSteps.map((s) => (
            <div key={s.kicker} className="content-card">
              <div className="content-k">{s.kicker}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="kicker">Decision control</p>
        <h2>
          Renovo drafts.
          <br />
          <span className="accent">Your team decides.</span>
        </h2>
        <div className="content-grid">
          {decisionControlCards.map((c) => (
            <div key={c.kicker} className="content-card">
              <div className="content-k">{c.kicker}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="kicker">System handoff</p>
        <h2>
          Built around
          <br />
          <span className="accent">existing workflows.</span>
        </h2>
        <div className="content-grid">
          {systemHandoffCards.map((c) => (
            <div key={c.kicker} className="content-card">
              <div className="content-k">{c.kicker}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>See the six steps run on a live case.</h3>
            <p className="cta-lite-sub">
              Bring an anonymised checkout — we&apos;ll walk through intake, draft, review, and dispute pack in thirty minutes.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <Link href="/demo" className="btn-outline">
              Try the interactive demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
