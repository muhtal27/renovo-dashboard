import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const payAsYouGoFeatures = {
  platform: [
    'Active case workspace',
    'Evidence upload and management',
    'AI-drafted liability assessments',
    'Manager approval workflow',
    'Audit trail and claim output',
    'Priority case tagging',
    'Fair wear and tear guidance hub',
    'Custom claim templates',
    'Dispute pack generation',
  ],
  team: [
    'Multi-user access',
    'Branch-level reporting',
    'Email and chat support',
  ],
} as const

const enterpriseFeatures = [
  'Unlimited users across branches',
  'Unlimited portfolio capacity',
  'Custom audit trail retention',
  'Dedicated account manager',
  'Priority phone support',
  'SLA and compliance review',
  'Multi-branch rollout support',
  'Bespoke onboarding programme',
  'API access for internal tooling',
  'Custom CRM and inventory integrations',
] as const

const addons = [
  {
    title: 'SSO (Single Sign-On)',
    desc: "Sign in via your agency's identity provider. Supports Microsoft Entra ID and SAML-based providers.",
  },
  {
    title: 'On-site technical support',
    desc: 'Hands-on assistance during rollout. Includes staff training, workflow configuration, and live troubleshooting.',
  },
  {
    title: 'Custom integrations',
    desc: 'Connect Renovo AI to your CRM, inventory software, or internal systems beyond our standard integrations.',
  },
  {
    title: 'Extended audit retention',
    desc: 'Retain case records and evidence trails beyond the standard period. Configurable to your compliance needs.',
  },
  {
    title: 'Dedicated onboarding',
    desc: 'Structured implementation programme. Includes workspace setup, data migration support, and team walkthroughs.',
  },
  {
    title: 'Analytics and reporting',
    desc: 'Track checkout volume, dispute rates, resolution times, and operator workload across your portfolio.',
  },
] as const

const compareRows: ({ section: string } | { feature: string; payg: string; ent: string })[] = [
  { section: 'Core platform' },
  { feature: 'Active case workspace', payg: '✓', ent: '✓' },
  { feature: 'Evidence upload and management', payg: '✓', ent: '✓' },
  { feature: 'AI-drafted liability assessments', payg: '✓', ent: '✓' },
  { feature: 'Manager approval workflow', payg: '✓', ent: '✓' },
  { feature: 'Audit trail and claim output', payg: '✓', ent: '✓' },
  { feature: 'Priority case tagging', payg: '✓', ent: '✓' },
  { feature: 'Fair wear and tear guidance hub', payg: '✓', ent: '✓' },
  { feature: 'Custom claim templates', payg: '✓', ent: '✓' },
  { feature: 'Dispute pack generation', payg: '✓', ent: '✓' },
  { section: 'Scale and access' },
  { feature: 'Portfolio capacity', payg: 'Usage-based', ent: 'Unlimited' },
  { feature: 'Team users', payg: 'Multi-user', ent: 'Unlimited' },
  { feature: 'Audit trail retention', payg: 'Standard', ent: 'Custom' },
  { feature: 'API access', payg: '—', ent: '✓' },
  { section: 'Support and onboarding' },
  { feature: 'Email and chat support', payg: '✓', ent: '✓' },
  { feature: 'Dedicated account manager', payg: '—', ent: '✓' },
  { feature: 'Priority phone support', payg: '—', ent: '✓' },
  { feature: 'Bespoke onboarding programme', payg: '—', ent: '✓' },
  { feature: 'SLA and compliance review', payg: '—', ent: '✓' },
  { feature: 'Multi-branch rollout support', payg: '—', ent: '✓' },
  { section: 'Integrations' },
  { feature: 'Standard integrations', payg: '✓', ent: '✓' },
  { feature: 'Custom CRM and inventory integrations', payg: '—', ent: '✓' },
  { feature: 'SSO (Single Sign-On)', payg: 'Add-on', ent: 'Add-on' },
]

export const pricingFaqs = [
  {
    q: 'How does Pay As You Go billing work?',
    a: 'You are billed per completed checkout. There is no monthly subscription, no minimum spend, and no contract. Use Renovo AI when you need it and only pay for what you process.',
  },
  {
    q: 'What counts as a completed checkout?',
    a: 'A completed checkout is one case processed through the Renovo AI workflow, from report intake through to deposit release or dispute pack generation. Drafts and incomplete cases are not billed.',
  },
  {
    q: 'Can I move from Pay As You Go to Enterprise?',
    a: 'Yes. You can upgrade at any time. Your existing case history and evidence trails carry over. We will work with you on the transition and onboarding.',
  },
  {
    q: 'Is VAT included?',
    a: 'No. All pricing is exclusive of VAT. UK VAT at the applicable rate (currently 20%) is added to invoices.',
  },
  {
    q: 'Where is data hosted?',
    a: 'All data is hosted in London, UK. Renovo AI complies with UK GDPR requirements. Role-based access and a full audit trail are enabled by default.',
  },
  {
    q: 'What integrations are supported?',
    a: 'Standard integrations include Reapit, Arthur Online, SME Professional, Fixflo, InventoryBase, No Letting Go, and HelloReport. Enterprise customers can request custom integrations for additional CRM or inventory software.',
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
            Start small. <em>Scale when ready.</em>
          </h1>
          <p className="page-copy mx-auto max-w-[760px]">
            Every plan includes the full Renovo AI workflow. Pay per checkout or
            talk to us about a dedicated setup for your team.
          </p>
        </section>

        {/* ── PLAN CARDS ── */}
        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* PAY AS YOU GO */}
            <article className="rounded-xl border border-zinc-200 bg-white p-7 text-zinc-950">
              <p className="inline-block rounded-full bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Flexible
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Pay As You Go</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Full platform access with usage-based billing. No contracts, no
                minimum commitment. Scale up or down as your portfolio moves.
              </p>
              <p className="mt-4 rounded-lg bg-emerald-500/[0.06] px-4 py-3 text-sm text-slate-600">
                One-time setup: £500 + VAT
              </p>

              <div className="mt-6 border-t border-zinc-200 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Platform
                </p>
                <ul className="mt-4 space-y-3">
                  {payAsYouGoFeatures.platform.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Team
                </p>
                <ul className="mt-4 space-y-3">
                  {payAsYouGoFeatures.team.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/contact" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Get started →
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Billed per completed checkout.
                </p>
              </div>
            </article>

            {/* ENTERPRISE */}
            <article className="rounded-xl border border-zinc-300 bg-slate-50 p-7 text-zinc-950">
              <p className="inline-block rounded-full bg-emerald-500/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Tailored
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Enterprise</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                For multi-branch agencies and portfolios above 5,000 tenancies.
                Dedicated onboarding, custom integrations, and SLA-backed support.
              </p>

              <div className="mt-6 border-t border-zinc-300 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Everything in Pay As You Go, plus
                </p>
                <ul className="mt-4 space-y-3">
                  {enterpriseFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <span className="mt-1.5 text-sm font-semibold text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/contact" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                  Talk to us →
                </Link>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Annual agreement. Priced around your portfolio.
                </p>
              </div>
            </article>

          </div>
        </section>

        {/* ── ADD-ONS ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Add-ons</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              Optional <em className="text-slate-400">add-ons</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-500">
              Available on any plan. Add what your team needs.
            </p>

            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {addons.map((a) => (
                <div key={a.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{a.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARE TABLE ── */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">Compare</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Compare <em className="text-slate-400">plans</em>
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-500">
            Both plans include the full Renovo AI workflow. Enterprise adds scale,
            dedicated support, and custom configuration.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-200 bg-zinc-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Feature
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Pay As You Go
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) =>
                  'section' in row ? (
                    <tr key={i}>
                      <td
                        colSpan={3}
                        className="bg-zinc-50 px-5 pb-2 pt-5 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400"
                      >
                        {row.section}
                      </td>
                    </tr>
                  ) : (
                    <tr key={i} className="border-t border-zinc-100 bg-white">
                      <td className="px-5 py-3 text-slate-700">{row.feature}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={row.payg === '✓' ? 'font-semibold text-emerald-500' : row.payg === '—' ? 'text-slate-300' : 'text-slate-500'}>
                          {row.payg}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={row.ent === '✓' ? 'font-semibold text-emerald-500' : row.ent === '—' ? 'text-slate-300' : 'text-slate-500'}>
                          {row.ent}
                        </span>
                      </td>
                    </tr>
                  )
                )}
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

        {/* ── CTA ── */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Ready to simplify your <em className="text-slate-400">checkout workflow</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-base leading-8 text-slate-500">
            Tell us about your team and portfolio. We will help you find the right setup.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get started →
            </Link>
            <Link
              href="/demo"
              className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              View demo
            </Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
