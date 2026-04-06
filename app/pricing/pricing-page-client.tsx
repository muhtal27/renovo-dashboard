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
    a: 'Only fully managed tenancies count toward your portfolio size. Let-only tenancies are included at no extra cost.',
  },
  {
    q: 'Are let-only tenancies included?',
    a: 'Yes. Let-only tenancies are included at no extra cost on every plan.',
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
            Pricing for <em className="text-slate-400">managed portfolios</em>
          </h1>
          <p className="page-copy mx-auto max-w-[760px]">
            Simple monthly pricing for letting agents, based on fully managed
            portfolio size. No setup fees. No contract. First month on us.
          </p>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="mx-auto flex max-w-[820px] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> No setup fees
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> No contract
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> First month on us
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Unlimited users
          </span>
        </section>

        {/* ── PLAN CARDS ── */}
        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* PORTFOLIO LICENCE */}
            <article className="relative border-2 border-emerald-500 bg-white p-7 text-zinc-950">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Most popular
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Portfolio Licence</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-zinc-950">£179</span>
                <span className="text-base text-slate-500">/month + VAT</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Up to 365 fully managed tenancies
              </p>

              <div className="mt-6 border-t border-zinc-200 pt-6">
                <ul className="space-y-3">
                  {[
                    'Let-only tenancies included at no extra cost',
                    'Unlimited users',
                    'Full Renovo AI workflow included',
                    'No contract',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/book-demo" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Get started →
                </Link>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Your first month is on us.
                </p>
              </div>
            </article>

            {/* ADDITIONAL PORTFOLIO BLOCK */}
            <article className="border border-zinc-200 bg-white p-7 text-zinc-950">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Scale
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Additional Block</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-zinc-950">+£179</span>
                <span className="text-base text-slate-500">/month + VAT</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Add up to 365 more fully managed tenancies
              </p>

              <div className="mt-6 border-t border-zinc-200 pt-6">
                <ul className="space-y-3">
                  {[
                    'Stack blocks as your portfolio grows',
                    'Let-only tenancies included at no extra cost',
                    'Unlimited users',
                    'Same full platform access',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/book-demo" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Book a demo →
                </Link>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Add portfolio blocks as you grow.
                </p>
              </div>
            </article>

            {/* ENTERPRISE */}
            <article className="border border-zinc-300 bg-slate-50 p-7 text-zinc-950">
              <p className="inline-block bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Tailored
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Enterprise</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-zinc-950">Custom</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                For portfolios above 5 blocks
              </p>

              <div className="mt-6 border-t border-zinc-300 pt-6">
                <ul className="space-y-3">
                  {[
                    '1,825+ fully managed tenancies',
                    'Multi-branch groups',
                    'Custom rollout and integrations',
                    'Tailored commercial terms',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
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
                <p className="mt-3 text-center text-xs text-slate-500">
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
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              Every plan includes the <em className="text-slate-400">full platform</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-500">
              No feature gates. Every Portfolio Licence includes the complete Renovo AI workflow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-4">
                  <span className="mt-0.5 text-sm font-semibold text-emerald-500">✓</span>
                  <span className="text-sm font-medium text-zinc-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT SCALES ── */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How it scales</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Add blocks as <em className="text-slate-400">you grow</em>
          </h2>
          <p className="mt-3 max-w-[640px] text-base leading-8 text-slate-500">
            Start with one Portfolio Licence for up to 365 fully managed tenancies, then add
            blocks as your portfolio grows. Let-only tenancies are always included at no extra cost.
          </p>

          <div className="mt-10 overflow-x-auto border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-200 bg-zinc-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Blocks
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Fully managed tenancies
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Monthly price
                  </th>
                </tr>
              </thead>
              <tbody>
                {scaleExamples.map((row) => (
                  <tr key={row.blocks} className="border-t border-zinc-100 bg-white">
                    <td className="px-5 py-3 font-medium text-zinc-950">
                      {row.blocks} {row.blocks === 1 ? 'block' : 'blocks'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">Up to {row.tenancies}</td>
                    <td className="px-5 py-3 font-medium text-zinc-950">{row.price}/mo + VAT</td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-200 bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-950">6+ blocks</td>
                  <td className="px-5 py-3 text-slate-600">1,825+</td>
                  <td className="px-5 py-3">
                    <Link href="/contact" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
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
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              Common <em className="text-slate-400">questions</em>
            </h2>

            <div className="mt-10 divide-y divide-slate-200">
              {pricingFaqs.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="cursor-pointer list-none text-sm font-medium text-zinc-950">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
