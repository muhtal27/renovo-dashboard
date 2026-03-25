'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { MarketingShell } from '@/app/components/MarketingShell'

type BillingPeriod = 'monthly' | 'annual'

type Plan = {
  name: 'Starter' | 'Agency' | 'Studio'
  tag: string
  setupFee: number
  monthlyPrice: number
  annualPrice: number
  save: number
  portfolio: string
  users: string
  storage: string
  support: string
  features: string[]
  cta: string
  highlighted?: boolean
}

type ComparisonRow = {
  feature: string
  starter: string
  agency: string
  studio: string
  muted?: boolean
}

const plans: Plan[] = [
  {
    name: 'Starter',
    tag: 'Solo property managers',
    setupFee: 199,
    monthlyPrice: 49,
    annualPrice: 490,
    save: 98,
    portfolio: 'Up to 30 tenancies',
    users: '1',
    storage: '2 years audit trail',
    support: 'Email only',
    features: [
      'Active case workspace',
      'Evidence upload',
      'AI-drafted recommendations',
      'Manager approval workflow',
      'Audit trail & claim output',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Agency',
    tag: 'Small letting agencies, 2–10 staff',
    setupFee: 399,
    monthlyPrice: 119,
    annualPrice: 1190,
    save: 238,
    portfolio: 'Up to 100 tenancies',
    users: 'Up to 6',
    storage: '5 years audit trail',
    support: 'Email + live chat',
    features: [
      'Everything in Starter',
      'Priority case tagging',
      'Multi-user access',
      'Branch reporting',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Studio',
    tag: 'Mid-size agencies, 10–50 staff',
    setupFee: 799,
    monthlyPrice: 229,
    annualPrice: 2290,
    save: 458,
    portfolio: 'Up to 300 tenancies',
    users: 'Up to 20',
    storage: '7 years audit trail',
    support: 'Priority + dedicated onboarding call',
    features: [
      'Everything in Agency',
      'Custom claim templates',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Get Started',
  },
]

const comparisonRows: ComparisonRow[] = [
  { feature: 'Active case workspace', starter: '✓', agency: '✓', studio: '✓' },
  {
    feature: 'Evidence upload (drag & drop + email)',
    starter: '✓',
    agency: '✓',
    studio: '✓',
  },
  { feature: 'AI-drafted recommendations', starter: '✓', agency: '✓', studio: '✓' },
  { feature: 'Manager approval workflow', starter: '✓', agency: '✓', studio: '✓' },
  { feature: 'Audit trail & claim output', starter: '✓', agency: '✓', studio: '✓' },
  { feature: 'Number of users', starter: '1', agency: 'Up to 6', studio: 'Up to 20' },
  {
    feature: 'Audit trail storage',
    starter: '2 years',
    agency: '5 years',
    studio: '7 years',
  },
  { feature: 'Live chat support', starter: '✗', agency: '✓', studio: '✓' },
  { feature: 'Priority support', starter: '✗', agency: '✗', studio: '✓' },
  { feature: 'Dedicated onboarding call', starter: '✗', agency: '✗', studio: '✓' },
  {
    feature: 'PMS sync',
    starter: 'Coming soon',
    agency: 'Coming soon',
    studio: 'Coming soon',
    muted: true,
  },
] as const

const faqs = [
  {
    q: 'What counts as a managed tenancy?',
    a: 'A managed tenancy is one active tenancy your team is handling inside the platform.',
  },
  {
    q: 'Is the setup fee refundable?',
    a: 'No. The setup fee covers onboarding and initial configuration work.',
  },
  {
    q: 'Can I upgrade or downgrade my plan later?',
    a: 'Yes. Plan changes can be arranged if your team size or portfolio changes.',
  },
  {
    q: 'What happens if I exceed my tenancy limit?',
    a: 'We will contact you to move you onto the next plan that fits your portfolio size.',
  },
  {
    q: 'Do you offer a free trial?',
    a: 'No. We currently offer early access instead of a self-serve free trial.',
  },
  {
    q: 'Is there a long-term contract?',
    a: 'No. The page pricing is set up without a long-term contract.',
  },
] as const

const perTenancyStats = [
  { label: 'Starter', value: '£1.63 / tenancy' },
  { label: 'Agency', value: '£1.19 / tenancy' },
  { label: 'Studio', value: '£0.76 / tenancy' },
] as const

function formatGBP(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function ComparisonCell({ value, muted = false }: { value: string; muted?: boolean }) {
  if (muted) {
    return <span className="text-sm italic text-stone-400">{value}</span>
  }

  const isSymbol = value === '✓' || value === '✗'

  return (
    <span
      className={
        isSymbol
          ? 'text-base font-semibold text-stone-900'
          : 'text-sm font-medium text-stone-900'
      }
    >
      {value}
    </span>
  )
}

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <MarketingShell currentPath="/pricing">
      <div className="page-shell page-stack text-stone-900">
        <section className="page-hero text-center">
          <p className="app-kicker">Pricing</p>
          <h1 className="page-title mx-auto max-w-4xl">Simple pricing. Serious time savings.</h1>
          <p className="page-copy mx-auto max-w-2xl">
            Set up in a day. No hidden fees. Cancel anytime. Built for letting agencies that want
            a cleaner end-of-tenancy workflow without a long rollout.
          </p>

          <div className="mt-8 inline-flex items-center gap-4 rounded-full border border-[rgba(15,14,13,0.1)] bg-white px-4 py-3">
            <span
              className={`text-sm transition-colors ${
                billing === 'monthly' ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              Monthly
            </span>

            <button
              type="button"
              aria-label="Toggle billing period"
              aria-pressed={billing === 'annual'}
              onClick={() =>
                setBilling((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))
              }
              className="relative h-7 w-14 rounded-full bg-stone-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-stone-900 transition-transform duration-300 ${
                  billing === 'monthly' ? 'left-1 translate-x-0' : 'left-1 translate-x-7'
                }`}
              />
            </button>

            <span
              className={`text-sm transition-colors ${
                billing === 'annual' ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              Annual
            </span>
          </div>

          <p className="mt-4 text-sm text-stone-500">
            Annual billing saves from £98 to £458 depending on plan.
          </p>
        </section>

        <section className="page-grid-3">
          {plans.map((plan) => {
            const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const suffix = billing === 'monthly' ? '/mo' : '/yr'

            return (
              <article
                key={plan.name}
                className={[
                  'page-card flex h-full flex-col',
                  plan.highlighted ? 'border-[#cdb78d]' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="app-kicker">{plan.tag}</p>
                    <h2 className="mt-3 text-[30px] leading-[1.1]">{plan.name}</h2>
                  </div>

                  {plan.highlighted ? (
                    <span className="rounded-full border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] px-3 py-1 text-xs font-medium text-[#7a7670]">
                      Most popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-8">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl tracking-tight text-stone-900">{formatGBP(price)}</span>
                    <span className="pb-1 text-base text-stone-500">{suffix}</span>
                  </div>
                  <p className="mt-3 text-sm text-stone-500">
                    Setup fee <span className="font-medium text-stone-800">{formatGBP(plan.setupFee)}</span> one-time
                  </p>
                </div>

                <div className="mt-8 space-y-3 border-y border-[rgba(15,14,13,0.08)] py-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-stone-500">Portfolio</span>
                    <span className="font-medium text-stone-900">{plan.portfolio}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-stone-500">Users</span>
                    <span className="font-medium text-stone-900">{plan.users}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-stone-500">Storage</span>
                    <span className="font-medium text-right text-stone-900">{plan.storage}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-stone-500">Support</span>
                    <span className="font-medium text-right text-stone-900">{plan.support}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-stone-600">
                      <span className="mt-0.5 inline-flex rounded-full border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-1 text-stone-900">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  <Link
                    href="/contact"
                    className={[
                      'inline-flex w-full items-center justify-center rounded px-4 py-3 text-sm font-medium',
                      plan.highlighted ? 'app-primary-button' : 'app-secondary-button',
                    ].join(' ')}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </article>
            )
          })}
        </section>

        <section className="page-card">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
            <div>
              <p className="app-kicker">Early access</p>
              <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
                Setup fee waived for the first 20 agencies
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#3d3b37]">
                Join early access now and save up to £799 on onboarding. If you manage more than
                300 tenancies, contact us and we&apos;ll price around your portfolio and team size.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/contact" className="app-primary-button rounded px-5 py-3 text-sm font-medium">
                  Claim early access
                </Link>
                <Link href="/demo" className="app-secondary-button rounded px-5 py-3 text-sm font-medium">
                  View live demo
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-6">
              <p className="app-kicker">Indicative cost per tenancy</p>
              <div className="mt-4 space-y-4">
                {perTenancyStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={index === perTenancyStats.length - 1 ? 'flex items-center justify-between gap-4' : 'flex items-center justify-between gap-4 border-b border-[rgba(15,14,13,0.08)] pb-4'}
                  >
                    <span className="text-sm text-stone-500">{stat.label}</span>
                    <span className="text-lg text-stone-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-card">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="app-kicker">Compare plans</p>
              <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
                Feature comparison
              </h2>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-[rgba(15,14,13,0.1)] bg-white">
            <table className="min-w-[760px] w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(15,14,13,0.1)] bg-[#fcfbf9]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-stone-900">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-stone-900">Agency</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-stone-900">Studio</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index !== comparisonRows.length - 1 ? 'border-b border-[rgba(15,14,13,0.08)]' : ''}
                  >
                    <td className="px-6 py-4 text-sm text-stone-600">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <ComparisonCell value={row.starter} muted={Boolean(row.muted)} />
                    </td>
                    <td className="bg-[#fcfbf9] px-6 py-4 text-center">
                      <ComparisonCell value={row.agency} muted={Boolean(row.muted)} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ComparisonCell value={row.studio} muted={Boolean(row.muted)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-card">
          <div className="mx-auto max-w-4xl">
            <p className="app-kicker text-center">FAQ</p>
            <h2 className="mt-3 text-center text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
              Common questions
            </h2>

            <div className="mt-8 space-y-4">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index

                return (
                  <div key={item.q} className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-medium text-stone-900">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-stone-400 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 text-sm leading-6 text-stone-600 sm:px-6">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="page-hero text-center">
          <h2 className="text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
            Ready to simplify every end of tenancy?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="app-primary-button inline-flex w-full items-center justify-center rounded px-5 py-3 text-sm font-medium sm:w-auto"
            >
              Request early access
            </Link>
            <Link
              href="/demo"
              className="app-secondary-button inline-flex w-full items-center justify-center rounded px-5 py-3 text-sm font-medium sm:w-auto"
            >
              Try live demo
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
