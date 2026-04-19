import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const platformFeatures = [
  'Full case workspace',
  'Evidence management',
  'AI-drafted liability assessments',
  'Manager approval workflow',
  'Immutable audit trail',
  'Dispute pack generation',
  'Custom claim templates',
  'Unlimited users',
] as const

const scaleExamples = [
  { blocks: 1, tenancies: '365', price: '£179' },
  { blocks: 2, tenancies: '730', price: '£358' },
  { blocks: 3, tenancies: '1,095', price: '£537' },
  { blocks: 4, tenancies: '1,460', price: '£716' },
  { blocks: 5, tenancies: '1,825', price: '£895' },
] as const

export const pricingFaqs = [
  {
    q: 'What counts toward pricing?',
    a: 'Only fully managed tenancies count toward your block pricing. Let-only tenancies are free on every plan, including the Free tier.',
  },
  {
    q: 'What is included in the Free plan?',
    a: 'The Free plan covers let-only tenancies with the full Renovo AI workflow, unlimited users, and no credit card required. To manage fully managed tenancies, upgrade to a Block plan.',
  },
  {
    q: 'Are there user limits?',
    a: 'No. All plans include unlimited users across your team.',
  },
  {
    q: 'Is there a contract?',
    a: 'No. Standard plans are monthly rolling with no minimum commitment. Cancel anytime.',
  },
  {
    q: 'How does Enterprise work?',
    a: 'Enterprise starts above 5 portfolio blocks (1,825+ fully managed tenancies). It covers larger multi-branch portfolios with custom rollout, integrations, and tailored commercial terms.',
  },
  {
    q: 'Is VAT included?',
    a: 'No. All pricing is exclusive of VAT. UK VAT at the applicable rate (currently 20%) is added to invoices.',
  },
  {
    q: 'Where is data hosted?',
    a: 'All data is hosted in London, UK. Renovo AI complies with UK GDPR requirements. Role-based access and a full audit trail are enabled by default.',
  },
] as const

export default function PricingPageClient() {
  return (
    <MarketingShell currentPath="/pricing">
      <div className="page-shell page-stack">

        {/* ── HERO ── */}
        <section className="page-hero text-center">
          <p className="app-kicker">Pricing</p>
          <h1 className="page-title mx-auto max-w-[820px]">
            Pricing for <em className="text-white/45">managed portfolios</em>
          </h1>
          <p className="page-copy mx-auto max-w-[760px]">
            Free for let-only portfolios. Simple block pricing for fully managed
            tenancies. No setup fees. No contract.
          </p>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="mx-auto flex max-w-[820px] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/55">
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> No setup fees
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> No contract
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Free for let-only
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Unlimited users
          </span>
        </section>

        {/* ── PLAN CARDS ── */}
        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* FREE */}
            <article className="border border-white/10 bg-white/[0.03] p-7 text-white">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Get started
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Free</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-white">£0</span>
                <span className="text-base text-white/55">/month</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                For let-only portfolios
              </p>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Always included</p>
                <ul className="space-y-3">
                  {[
                    'Full case workspace and evidence management',
                    'AI drafted liability assessments',
                    'Approval workflows and audit trail',
                    'Dispute pack generation (PDF)',
                    'Custom templates, unlimited seats',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-white/65">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/book-demo" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Get started free →
                </Link>
                <p className="mt-3 text-center text-xs text-white/55">
                  No commitment. No credit card.
                </p>
              </div>
            </article>

            {/* PORTFOLIO */}
            <article className="relative border-2 border-emerald-500 bg-white/[0.03] p-7 text-white">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Most popular
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Portfolio 365</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-white">£179</span>
                <span className="text-base text-white/55">/block/month + VAT</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                Up to 365 fully managed tenancies per block
              </p>

              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Everything in Free, plus</p>
                <ul className="space-y-3">
                  {[
                    'Fully managed tenancy workflow',
                    'Scheme submission (TDS, DPS, mydeposits, SDS)',
                    'Unlimited users, no contract',
                    'First month free',
                    'Priority email support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-white/65">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/checkout" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Get started →
                </Link>
                <p className="mt-3 text-center text-xs text-white/55">
                  First month on us.
                </p>
              </div>
            </article>

            {/* ENTERPRISE */}
            <article className="border border-white/15 bg-white/[0.03] p-7 text-white">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Tailored
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Enterprise</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-white">Custom</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                For portfolios above 5 blocks
              </p>

              <div className="mt-6 border-t border-white/15 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">Everything in Portfolio 365, plus</p>
                <ul className="space-y-3">
                  {[
                    'Single sign-on via Microsoft Entra ID',
                    'Custom data retention',
                    'Custom integrations and API access',
                    'Named account manager and SLA',
                    'Security review pack on request',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-white/75">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/contact" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Talk to sales →
                </Link>
                <p className="mt-3 text-center text-xs text-white/55">
                  Enterprise pricing starts above 5 portfolio blocks.
                </p>
              </div>
            </article>

          </div>
        </section>

        {/* ── WHAT'S INCLUDED ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Included</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Every plan includes the <em className="text-white/45">full platform</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-white/55">
              No feature gates. Every plan — including Free — includes the complete Renovo AI workflow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4">
                  <span className="mt-0.5 text-sm font-semibold text-emerald-500">✓</span>
                  <span className="text-sm font-medium text-white/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT SCALES ── */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How it scales</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Add blocks as <em className="text-white/45">you grow</em>
          </h2>
          <p className="mt-3 max-w-[640px] text-base leading-8 text-white/55">
            Start free with let-only tenancies, then add blocks at £179/month each for up to
            365 fully managed tenancies per block. Let-only tenancies are always free.
          </p>

          <div className="mt-10 overflow-x-auto border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-white/55">
                    Blocks
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-white/55">
                    Fully managed tenancies
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-white/55">
                    Monthly price
                  </th>
                </tr>
              </thead>
              <tbody>
                {scaleExamples.map((row) => (
                  <tr key={row.blocks} className="border-t border-white/[0.06] bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium text-white">
                      {row.blocks} {row.blocks === 1 ? 'block' : 'blocks'}
                    </td>
                    <td className="px-5 py-3 text-white/65">Up to {row.tenancies}</td>
                    <td className="px-5 py-3 font-medium text-white">{row.price}/mo + VAT</td>
                  </tr>
                ))}
                <tr className="border-t border-white/10 bg-white/[0.03]">
                  <td className="px-5 py-3 font-medium text-white">6+ blocks</td>
                  <td className="px-5 py-3 text-white/65">1,825+</td>
                  <td className="px-5 py-3">
                    <Link href="/contact" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                      Talk to sales →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[680px] px-6 py-24">
            <p className="app-kicker">FAQ</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Common <em className="text-white/45">questions</em>
            </h2>

            <div className="mt-10 divide-y divide-white/10">
              {pricingFaqs.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="cursor-pointer list-none text-sm font-medium text-white">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-white/55">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
