'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronDown, Clock3, ShieldCheck, Sparkles } from 'lucide-react'
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
    return <span className="text-sm italic text-slate-500">{value}</span>
  }

  const isSymbol = value === '✓' || value === '✗'

  return (
    <span
      className={
        isSymbol
          ? 'text-base font-semibold text-slate-100'
          : 'text-sm font-medium text-slate-100'
      }
    >
      {value}
    </span>
  )
}

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const billingLabel = billing === 'monthly' ? 'Monthly' : 'Annual'

  return (
    <MarketingShell currentPath="/pricing">
      <div className="rounded-[2.45rem] bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <section className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/90">
              Pricing
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Simple pricing. Serious time savings.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Set up in a day. No hidden fees. Cancel anytime.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>No long-term contract</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Setup included in onboarding call</span>
              </div>
            </div>
          </section>

          <section className="mt-12 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-4 rounded-full border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <span
                className={`text-sm transition-colors ${
                  billing === 'monthly' ? 'text-white' : 'text-slate-400'
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
                className="relative h-7 w-14 rounded-full bg-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    billing === 'monthly'
                      ? 'left-1 translate-x-0'
                      : 'left-1 translate-x-7'
                  }`}
                />
              </button>

              <span
                className={`text-sm transition-colors ${
                  billing === 'annual' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Annual
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              Billing: <span className="text-slate-200">{billingLabel}</span>
            </p>
          </section>

          <section className="mt-12">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
              {plans.map((plan) => {
                const price =
                  billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                const suffix = billing === 'monthly' ? '/mo' : '/yr'

                return (
                  <article
                    key={plan.name}
                    className={[
                      'relative flex h-full flex-col rounded-3xl border p-6 transition-all duration-300',
                      plan.highlighted
                        ? 'border-amber-400/40 bg-gradient-to-b from-slate-900 to-[#0b1627] shadow-2xl shadow-amber-950/20 ring-1 ring-amber-400/20 lg:-my-3 lg:px-7 lg:py-7'
                        : 'border-slate-800 bg-slate-950/70 shadow-lg shadow-black/10',
                    ].join(' ')}
                  >
                    {plan.highlighted ? (
                      <div className="absolute right-5 top-5 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                        Most Popular
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
                        <p className="mt-2 text-sm text-slate-400">{plan.tag}</p>
                      </div>

                      {billing === 'annual' ? (
                        <div className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          Save £{plan.save}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-8">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-semibold tracking-tight text-white">
                          {formatGBP(price)}
                        </span>
                        <span className="pb-1 text-base text-slate-400">{suffix}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        Setup fee:{' '}
                        <span className="font-medium text-slate-200">
                          {formatGBP(plan.setupFee)}
                        </span>{' '}
                        one-time
                      </p>
                    </div>

                    <div className="mt-8 space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Portfolio</span>
                        <span className="text-sm font-medium text-slate-100">
                          {plan.portfolio}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Users</span>
                        <span className="text-sm font-medium text-slate-100">
                          {plan.users}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Storage</span>
                        <span className="text-sm font-medium text-slate-100">
                          {plan.storage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Support</span>
                        <span className="text-right text-sm font-medium text-slate-100">
                          {plan.support}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm text-slate-300"
                        >
                          <span className="mt-0.5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 p-1 text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 pt-2">
                      <Link
                        href="/#waitlist"
                        className={[
                          'inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                          plan.highlighted
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                            : 'border border-slate-700 bg-transparent text-slate-100 hover:border-slate-500 hover:bg-slate-900',
                        ].join(' ')}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base font-medium text-slate-100">
                  Managing 300+ tenancies? Let&apos;s talk.
                </p>
                <Link
                  href="/#waitlist"
                  className="inline-flex items-center text-sm font-medium text-amber-300 transition-colors hover:text-amber-200"
                >
                  Book a call →
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-12">
            <div className="overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-orange-300/10 p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/15 text-amber-200">
                    <Clock3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white sm:text-2xl">
                      Early access offer — Setup fee waived for the first 20 agencies.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-amber-50/85 sm:text-base">
                      Join now and save up to £799 on onboarding.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/#waitlist"
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    Claim Early Access
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                What does it actually cost per tenancy?
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {perTenancyStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center"
                >
                  <p className="text-sm uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-sm text-slate-400 sm:text-base">
              Less than the cost of a single solicitor call — and the decision is already documented.
            </p>
          </section>

          <section className="mt-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Compare plans
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Feature comparison
                </h2>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/60">
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70">
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-100">
                      Starter
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-amber-200">
                      Agency
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-100">
                      Studio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={
                        index !== comparisonRows.length - 1
                          ? 'border-b border-slate-800'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        <ComparisonCell value={row.starter} muted={Boolean(row.muted)} />
                      </td>
                      <td className="bg-amber-400/5 px-6 py-4 text-center">
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

          <section className="mt-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Common questions
              </h2>
            </div>

            <div className="mx-auto mt-8 max-w-4xl space-y-4">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index

                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-medium text-slate-100">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
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
                        <div className="px-5 pb-5 text-sm leading-6 text-slate-400 sm:px-6">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-20">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950/80 to-slate-950/50 px-6 py-12 text-center sm:px-8">
              <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ready to simplify every end of tenancy?
              </h2>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/#waitlist"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:w-auto"
                >
                  Request Early Access
                </Link>
                <Link
                  href="/#platform"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
                >
                  Try Live Demo
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
