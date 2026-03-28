import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

type Plan = {
  name: 'Branch' | 'Regional' | 'Group'
  segment: string
  price: string
  billingNote: string
  setupFee: string
  roiText: string
  portfolio: string
  users: string
  support: string
  features: string[]
}

const valueProof = [
  {
    label: 'Monthly salary on checkout admin',
    value: '£920',
    subtext: 'Based on £23,500 salary and 30 cases per month',
  },
  {
    label: 'Hours spent on manual admin',
    value: '75h',
    subtext: 'Using 2.5 hours per checkout across 30 cases',
  },
  {
    label: 'Admin time recovered',
    value: '60%+',
    subtext: 'Typical saving modelled in the ROI examples below',
  },
] as const

const plans: Plan[] = [
  {
    name: 'Branch',
    segment: 'Single-branch agencies and smaller teams',
    price: '£4,188/year + VAT',
    billingNote: 'Annual billing',
    setupFee: '£600 + VAT',
    roiText: '~4x return on investment',
    portfolio: 'Up to 1,500 managed tenancies',
    users: 'Up to 6 users',
    support: 'Email, chat, and phone support',
    features: [
      'Checkout case workspace',
      'Evidence upload and organisation',
      'AI-drafted liability assessment',
      'Manager approval workflow',
      'Deduction letter support',
      'Dispute evidence pack output',
    ],
  },
  {
    name: 'Regional',
    segment: 'Multi-branch agencies with central review',
    price: '£9,588/year + VAT',
    billingNote: 'Annual billing',
    setupFee: '£600 + VAT',
    roiText: '~5x return on investment',
    portfolio: 'Up to 5,000 managed tenancies',
    users: 'Up to 20 users',
    support: 'Priority support and onboarding',
    features: [
      'Everything in Branch',
      'Multi-user case review',
      'Branch-level reporting',
      'Custom claim templates',
      'Priority workflow support',
      'Rollout support across multiple teams',
    ],
  },
  {
    name: 'Group',
    segment: 'Larger agency groups with custom workflow needs',
    price: 'Custom annual contract + VAT',
    billingNote: 'Annual billing',
    setupFee: '£1,500 + VAT',
    roiText: 'ROI scales with volume',
    portfolio: 'Custom portfolio scope',
    users: 'Custom user allocation',
    support: 'Dedicated support and onboarding',
    features: [
      'Everything in Regional',
      'Custom workflow design',
      'Custom integrations',
      'Dedicated account support',
      'Expanded compliance review',
      'Group rollout planning',
    ],
  },
] as const

const faqs = [
  {
    q: 'How are the ROI examples calculated?',
    a: 'They are based on a £23,500 property manager salary handling 30 checkouts per month at 2.5 hours each. That equates to around £920 per month of salary time spent on manual checkout administration before considering dispute rework.',
  },
  {
    q: 'Is VAT included in the listed prices?',
    a: 'No. All listed prices are exclusive of VAT. VAT is added at the applicable UK rate.',
  },
  {
    q: 'What does the setup fee cover?',
    a: 'The setup fee covers onboarding, workspace setup, and initial workflow configuration for your team. Group plans include a broader implementation scope.',
  },
  {
    q: 'Can plans change later?',
    a: 'Yes. If your portfolio size or team structure changes, the plan can be reviewed and adjusted.',
  },
] as const

export default function PricingPageClient() {
  return (
    <MarketingShell currentPath="/pricing">
      <div className="page-shell page-stack">
        <section className="page-hero text-center">
          <p className="app-kicker">Pricing</p>
          <h1 className="page-title mx-auto max-w-[820px]">
            Annual pricing built around the time Renovo AI gives back to your team.
          </h1>
          <p className="page-copy mx-auto max-w-[760px]">
            For agencies still writing deduction letters manually, the cost of checkout admin is
            often higher than the annual software investment. The pricing below is built around
            that operating reality, with annual billing only.
          </p>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50 py-14 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {valueProof.map((item) => (
              <article key={item.label} className="rounded-xl border border-zinc-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.subtext}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-xl border border-zinc-200 bg-white p-7 text-zinc-950"
              >
                <p className="text-sm text-zinc-500">{plan.segment}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{plan.name}</h2>
                <p className="mt-5 text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.05em]">
                  {plan.price}
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-500">{plan.billingNote}</p>
                <p className="mt-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  One-time setup: {plan.setupFee}
                </p>
                <p className="mt-4 text-sm font-medium text-zinc-700">{plan.roiText}</p>

                <div className="mt-6 space-y-2 border-t border-zinc-200 pt-6">
                  <p className="text-sm text-zinc-600">{plan.portfolio}</p>
                  <p className="text-sm text-zinc-600">{plan.users}</p>
                  <p className="text-sm text-zinc-600">{plan.support}</p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/contact" className="app-primary-button w-full rounded-md px-4 py-3 text-sm font-medium">
                    Get started →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">FAQ</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Common <em>pricing questions</em>
            </h2>
          </div>

          <div className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {faqs.map((item) => (
              <details key={item.q} className="group bg-white px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-zinc-950">
                  {item.q}
                </summary>
                <p className="mt-3 pr-6 text-sm leading-7 text-zinc-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
            Want to compare annual pricing against your <em>current admin load</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
            If you can estimate checkout volume, deduction letter time, and dispute preparation
            effort, we can map the right plan to the workflow your agency is running today.
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
