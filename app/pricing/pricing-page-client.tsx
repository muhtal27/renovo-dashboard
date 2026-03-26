'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { MarketingShell } from '@/app/components/MarketingShell'

type BillingPeriod = 'monthly' | 'annual'

type ValueProof = {
  label: string
  value: string
  subtext: string
  tone: 'waste' | 'save'
}

type Plan = {
  name: 'Branch' | 'Regional' | 'Group'
  segment: string
  monthlyPrice?: number
  annualPrice?: number
  annualBillingText?: string
  vatLabel: string
  setupFee: string
  roiText: string
  portfolio: string
  users: string
  auditTrail: string
  support: string
  features: string[]
  cta: string
  href: string
  tone: 'primary' | 'outline' | 'enterprise'
  badge?: string
  effectiveCost: string
  customPricingText?: string
}

type ComparisonRow = {
  feature: string
  branch: string
  regional: string
  group: string
  allPlansNote?: boolean
}

const valueProof: ValueProof[] = [
  {
    label: 'Monthly salary on checkout admin',
    value: '£920',
    subtext: 'Based on £23,500 salary, 30 cases/mo',
    tone: 'waste',
  },
  {
    label: 'Hours burned per month',
    value: '75h',
    subtext: '2.5 hours per checkout × 30',
    tone: 'waste',
  },
  {
    label: 'Admin time recovered',
    value: '60%+',
    subtext: 'Average across early access agencies',
    tone: 'save',
  },
] as const

const plans: Plan[] = [
  {
    name: 'Branch',
    segment: 'Letting agencies · 2-10 staff',
    monthlyPrice: 349,
    annualPrice: 289,
    annualBillingText: '£3,468 + VAT billed annually',
    vatLabel: '+ VAT',
    setupFee: '£600 + VAT',
    roiText: '~4x return on investment',
    portfolio: 'Up to 1,500',
    users: 'Up to 6',
    auditTrail: '3 years',
    support: 'Email, chat, phone',
    features: [
      'Active case workspace',
      'Evidence upload & management',
      'AI-drafted liability assessments',
      'Manager approval workflow',
      'Audit trail & claim output',
      'Priority case tagging',
      'Multi-user access',
      'Branch reporting',
      'Custom claim templates',
      'API access',
      'Dedicated account manager',
      'Phone support',
      'On-site technical support',
      'SLA & compliance review',
      'Multi-branch rollout support',
      'Custom integrations',
    ],
    cta: 'Get started',
    href: '/contact',
    tone: 'primary',
    effectiveCost: '~£5.82',
  },
  {
    name: 'Regional',
    segment: 'Multi-branch agencies · 10-50 staff',
    monthlyPrice: 799,
    annualPrice: 669,
    annualBillingText: '£8,028 + VAT billed annually',
    vatLabel: '+ VAT',
    setupFee: '£600 + VAT',
    roiText: '~5x return on investment',
    portfolio: 'Up to 5,000',
    users: 'Up to 20',
    auditTrail: '5 years',
    support: 'Priority + phone',
    features: [
      'Active case workspace',
      'Evidence upload & management',
      'AI-drafted liability assessments',
      'Manager approval workflow',
      'Audit trail & claim output',
      'Priority case tagging',
      'Multi-user access',
      'Branch reporting',
      'Custom claim templates',
      'API access',
      'Dedicated account manager',
      'Phone support',
      'On-site technical support',
      'SLA & compliance review',
      'Multi-branch rollout support',
      'Custom integrations',
      'Dedicated onboarding call',
    ],
    cta: 'Get started',
    href: '/contact',
    tone: 'outline',
    effectiveCost: '~£4.44',
  },
  {
    name: 'Group',
    segment: 'Large agencies · 5,000+ managed tenancies',
    vatLabel: '+ VAT',
    setupFee: '£1,500 + VAT',
    roiText: 'ROI scales with volume',
    portfolio: 'Unlimited',
    users: 'Unlimited',
    auditTrail: 'Custom',
    support: 'Dedicated',
    features: [
      'Active case workspace',
      'Evidence upload & management',
      'AI-drafted liability assessments',
      'Manager approval workflow',
      'Audit trail & claim output',
      'Priority case tagging',
      'Multi-user access',
      'Branch reporting',
      'Custom claim templates',
      'API access',
      'Dedicated account manager',
      'Phone support',
      'On-site technical support',
      'SLA & compliance review',
      'Multi-branch rollout support',
      'Custom integrations',
      'Bespoke onboarding programme',
    ],
    cta: 'Talk to us',
    href: '/contact',
    tone: 'enterprise',
    badge: 'Tailored',
    effectiveCost: 'Contact us',
    customPricingText: 'Priced around your portfolio and team',
  },
] as const

const comparisonRows: ComparisonRow[] = [
  { feature: 'Active case workspace', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Evidence upload & management', branch: 'check', regional: 'check', group: 'check' },
  {
    feature: 'AI-drafted liability assessments',
    branch: 'check',
    regional: 'check',
    group: 'check',
  },
  { feature: 'Manager approval workflow', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Audit trail & claim output', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Priority case tagging', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Multi-user access', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Branch reporting', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Custom claim templates', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'API access', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Dedicated account manager', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Phone support', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'On-site technical support', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'SLA & compliance review', branch: 'check', regional: 'check', group: 'check' },
  {
    feature: 'Multi-branch rollout support',
    branch: 'check',
    regional: 'check',
    group: 'check',
  },
  { feature: 'Custom integrations', branch: 'check', regional: 'check', group: 'check' },
  { feature: 'Number of users', branch: 'Up to 6', regional: 'Up to 20', group: 'Unlimited' },
  {
    feature: 'Portfolio capacity',
    branch: 'Up to 1,500',
    regional: 'Up to 5,000',
    group: 'Unlimited',
  },
  { feature: 'Audit trail storage', branch: '3 years', regional: '5 years', group: 'Custom' },
  { feature: 'Setup fee', branch: '£600 + VAT', regional: '£600 + VAT', group: '£1,500 + VAT' },
  {
    feature: 'PMS sync',
    branch: 'Coming soon across all plans',
    regional: '',
    group: '',
    allPlansNote: true,
  },
] as const

const faqs = [
  {
    q: 'How did you calculate the ROI figures?',
    a: 'Based on a £23,500 property manager salary handling 30 checkouts per month at 2.5 hours each. That is approximately £920 per month in salary spent on checkout admin. Renovo typically saves 60% or more of that time. The ROI figures are conservative and exclude additional value from fewer lost disputes and reduced complaints.',
  },
  {
    q: 'What counts as a managed tenancy?',
    a: 'A managed tenancy is one active tenancy your team is handling inside the platform at any given time.',
  },
  {
    q: 'Is VAT included in the listed prices?',
    a: 'No. All prices are listed exclusive of VAT. UK VAT at the applicable rate (currently 20%) will be added to your invoice. This applies to both the monthly subscription and the one-time setup fee.',
  },
  {
    q: 'What does the setup fee cover?',
    a: 'The setup fee covers onboarding, initial configuration, and workspace setup for your team. Enterprise setup includes bespoke configuration, data migration support, and a dedicated onboarding programme.',
  },
  {
    q: 'Is the setup fee refundable?',
    a: 'No. The setup fee is non-refundable as it covers onboarding and configuration work completed during implementation.',
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: 'Yes. Plan changes can be arranged at any time. We will pro-rate any differences to your next billing cycle.',
  },
  {
    q: 'What happens if I exceed my tenancy limit?',
    a: 'We will contact you to move you onto the next plan that fits your portfolio size. No surprise charges.',
  },
] as const

function formatGBP(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function CheckBadge({ enterprise = false }: { enterprise?: boolean }) {
  return (
    <span
      className={[
        'inline-flex h-5 w-5 items-center justify-center rounded-full',
        enterprise ? 'bg-[rgba(201,169,78,0.16)] text-[#c9a94e]' : 'bg-[#e4f2eb] text-[#1b6b4a]',
      ].join(' ')}
    >
      <Check className="h-3 w-3" strokeWidth={2.25} />
    </span>
  )
}

function ComparisonValue({
  value,
  enterprise = false,
}: {
  value: string
  enterprise?: boolean
}) {
  if (value === 'check') {
    return <CheckBadge enterprise={enterprise} />
  }

  return <span>{value}</span>
}

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <MarketingShell currentPath="/pricing">
      <div className="bg-[#f6f5f1] text-[#1a1a18]">
        <section className="mx-auto max-w-[760px] px-6 pb-0 pt-16 text-center md:px-8 md:pt-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#8a8a80]">
            Pricing
          </p>
          <h1 className="mt-5 text-[clamp(2.4rem,5vw,3.5rem)] leading-[1.08] tracking-[-0.03em] text-[#1a1a18]">
            Priced on the value <em className="not-italic text-[#1b6b4a]">we create</em>
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[15px] font-light leading-8 text-[#5c5c55]">
            The average property manager spends £920 per month on checkout admin alone. Renovo
            gives most of that time back and charges a fraction of what it saves.
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-[1200px] px-6 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {valueProof.map((item) => (
              <article
                key={item.label}
                className={[
                  'rounded-[18px] border px-5 py-5',
                  item.tone === 'save'
                    ? 'border-[rgba(27,107,74,0.14)] bg-[rgba(228,242,235,0.72)]'
                    : 'border-[rgba(0,0,0,0.07)] bg-white',
                ].join(' ')}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a80]">
                  {item.label}
                </p>
                <p className="mt-3 text-[2rem] leading-none tracking-[-0.04em] text-[#1a1a18]">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-light leading-6 text-[#6f6f67]">{item.subtext}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 flex max-w-[1200px] flex-col items-center px-6 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.08)] bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={[
                'rounded-full px-4 py-2 text-sm transition-colors',
                billing === 'monthly' ? 'bg-[#1a1a18] text-white' : 'text-[#7a7a72]',
              ].join(' ')}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-label="Toggle billing period"
              aria-pressed={billing === 'annual'}
              onClick={() =>
                setBilling((current) => (current === 'monthly' ? 'annual' : 'monthly'))
              }
              className="relative h-8 w-14 rounded-full bg-[#e7e4de]"
            >
              <span
                className={[
                  'absolute top-1 h-6 w-6 rounded-full bg-[#1b6b4a] transition-transform duration-300',
                  billing === 'annual' ? 'translate-x-7' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={[
                'rounded-full px-4 py-2 text-sm transition-colors',
                billing === 'annual' ? 'bg-[#1a1a18] text-white' : 'text-[#7a7a72]',
              ].join(' ')}
            >
              Annual
            </button>
          </div>
          <p className="mt-4 text-sm text-[#7a7a72]">Save up to 17%</p>
        </section>

        <section className="mx-auto mt-10 max-w-[1320px] px-6 md:px-8">
          <div className="grid gap-6 xl:grid-cols-3">
            {plans.map((plan) => {
              const isEnterprise = plan.tone === 'enterprise'
              const hasPrice = typeof plan.monthlyPrice === 'number' && typeof plan.annualPrice === 'number'
              const displayedPrice =
                hasPrice && billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
              const displayedBillingCopy =
                hasPrice && billing === 'annual' ? '/month' : hasPrice ? '/month' : null

              return (
                <article
                  key={plan.name}
                  className={[
                    'rounded-[28px] border p-7 md:p-8',
                    isEnterprise
                      ? 'border-[rgba(0,0,0,0.06)] bg-[#1a1a18] text-white'
                      : 'border-[rgba(0,0,0,0.08)] bg-white text-[#1a1a18]',
                  ].join(' ')}
                >
                  {plan.badge ? (
                    <div className="mb-5 inline-flex rounded-full bg-[rgba(201,169,78,0.14)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#c9a94e]">
                      {plan.badge}
                    </div>
                  ) : null}

                  <p
                    className={[
                      'text-sm font-light',
                      isEnterprise ? 'text-[#bdbcb2]' : 'text-[#707068]',
                    ].join(' ')}
                  >
                    {plan.segment}
                  </p>
                  <h2 className="mt-3 text-[2.1rem] leading-none tracking-[-0.03em]">{plan.name}</h2>

                  <div className="mt-6 flex items-end gap-2">
                    {displayedPrice ? (
                      <>
                        <span className="text-[3rem] leading-none tracking-[-0.05em]">
                          {formatGBP(displayedPrice)}
                        </span>
                        {displayedBillingCopy ? (
                          <span
                            className={[
                              'pb-1 text-sm',
                              isEnterprise ? 'text-[#c9c8bf]' : 'text-[#7a7a72]',
                            ].join(' ')}
                          >
                            {displayedBillingCopy}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-[3rem] leading-none tracking-[-0.05em]">Custom</span>
                    )}
                  </div>

                  <p
                    className={[
                      'mt-2 text-sm',
                      isEnterprise ? 'text-[#c9c8bf]' : 'text-[#7a7a72]',
                    ].join(' ')}
                  >
                    {plan.vatLabel}
                  </p>
                  <p
                    className={[
                      'mt-2 min-h-6 text-sm',
                      isEnterprise ? 'text-[#bdbcb2]' : 'text-[#6a6a63]',
                    ].join(' ')}
                  >
                    {billing === 'annual' ? plan.annualBillingText ?? plan.customPricingText ?? '' : plan.customPricingText ?? ''}
                  </p>

                  <div
                    className={[
                      'mt-5 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px]',
                      isEnterprise
                        ? 'bg-[rgba(255,255,255,0.06)] text-[#d5d3cb]'
                        : 'bg-[#f4f1eb] text-[#5c5c55]',
                    ].join(' ')}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
                      i
                    </span>
                    <span>One-time setup: {plan.setupFee}</span>
                  </div>

                  <div
                    className={[
                      'mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium',
                      isEnterprise
                        ? 'bg-[rgba(201,169,78,0.12)] text-[#d8bc69]'
                        : 'bg-[rgba(27,107,74,0.05)] text-[#1b6b4a]',
                    ].join(' ')}
                  >
                    <span className="text-sm">↑</span>
                    <span>{plan.roiText}</span>
                  </div>

                  <div
                    className={[
                      'mt-6 grid grid-cols-2 gap-4 border-b pb-6',
                      isEnterprise ? 'border-[rgba(255,255,255,0.08)]' : 'border-[rgba(0,0,0,0.07)]',
                    ].join(' ')}
                  >
                    <div>
                      <p className={isEnterprise ? 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8f8e85]' : 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8a8a80]'}>
                        Portfolio
                      </p>
                      <p className="mt-1 text-sm font-medium">{plan.portfolio}</p>
                    </div>
                    <div>
                      <p className={isEnterprise ? 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8f8e85]' : 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8a8a80]'}>
                        Users
                      </p>
                      <p className="mt-1 text-sm font-medium">{plan.users}</p>
                    </div>
                    <div>
                      <p className={isEnterprise ? 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8f8e85]' : 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8a8a80]'}>
                        Audit trail
                      </p>
                      <p className="mt-1 text-sm font-medium">{plan.auditTrail}</p>
                    </div>
                    <div>
                      <p className={isEnterprise ? 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8f8e85]' : 'text-[10px] font-medium uppercase tracking-[0.08em] text-[#8a8a80]'}>
                        Support
                      </p>
                      <p className="mt-1 text-sm font-medium">{plan.support}</p>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={[
                          'flex items-start gap-2.5 text-[13px] font-light leading-6',
                          isEnterprise ? 'text-[#d0cfc7]' : 'text-[#5c5c55]',
                        ].join(' ')}
                      >
                        <span className="mt-1">
                          <CheckBadge enterprise={isEnterprise} />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href={plan.href}
                      className={[
                        'block w-full rounded-[10px] px-4 py-3 text-center text-[13px] font-medium tracking-[0.02em] transition-colors',
                        plan.tone === 'primary'
                          ? 'bg-[#1b6b4a] text-white hover:bg-[#155c3e]'
                          : plan.tone === 'enterprise'
                            ? 'bg-[linear-gradient(135deg,#8b6914,#a07d1c)] text-white hover:opacity-90'
                            : 'border border-[rgba(0,0,0,0.10)] bg-transparent text-[#1a1a18] hover:bg-[#f9f8f5]',
                      ].join(' ')}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto mt-4 max-w-[1200px] px-6 md:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-lg border border-[rgba(0,0,0,0.07)] bg-white px-4 py-3 text-center text-xs font-light tracking-[0.02em] text-[#8a8a80]"
              >
                Effective cost per checkout:{' '}
                <strong className="font-medium text-[#1a1a18]">{plan.effectiveCost}</strong>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs font-light tracking-[0.02em] text-[#b0b0a6]">
            All prices exclusive of VAT. VAT charged at the applicable UK rate (currently 20%).
          </p>
        </section>

        <section className="mx-auto mt-24 max-w-[960px] px-6 md:px-8">
          <h2 className="text-center text-[36px] leading-none tracking-[-0.03em]">
            Compare <em className="not-italic text-[#1b6b4a]">every plan</em>
          </h2>
          <p className="mt-3 text-center text-sm font-light text-[#8a8a80]">
            Every plan includes every feature. Higher tiers add scale, users, and onboarding
            depth.
          </p>

          <div className="mt-12 overflow-x-auto rounded-[12px] border border-[rgba(0,0,0,0.07)] bg-white">
            <table className="min-w-[760px] w-full border-collapse">
              <thead>
                <tr className="bg-[#f9f8f5]">
                  <th className="border-b border-[rgba(0,0,0,0.10)] px-5 py-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#8a8a80]">
                    Feature
                  </th>
                  <th className="border-b border-[rgba(0,0,0,0.10)] px-5 py-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#1a1a18]">
                    Branch
                  </th>
                  <th className="border-b border-[rgba(0,0,0,0.10)] px-5 py-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#1a1a18]">
                    Regional
                  </th>
                  <th className="border-b border-[rgba(0,0,0,0.10)] px-5 py-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#1a1a18]">
                    Group
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index < comparisonRows.length - 1 ? 'border-b border-[rgba(0,0,0,0.07)]' : ''}
                  >
                    <td className="px-5 py-3.5 text-sm font-light text-[#5c5c55]">{row.feature}</td>
                    {row.allPlansNote ? (
                      <td
                        colSpan={3}
                        className="px-5 py-3.5 text-center text-[11px] italic text-[#b0b0a6]"
                      >
                        {row.branch}
                      </td>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 text-center text-sm text-[#5c5c55]">
                          <ComparisonValue value={row.branch} />
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-[#5c5c55]">
                          <ComparisonValue value={row.regional} />
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-[#5c5c55]">
                          <ComparisonValue value={row.group} enterprise />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-[680px] px-6 pb-24 pt-24 md:px-8">
          <h2 className="text-center text-[36px] leading-none tracking-[-0.03em]">
            Common questions
          </h2>

          <div className="mt-12">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index

              return (
                <div key={item.q} className="border-b border-[rgba(0,0,0,0.07)]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm text-[#1a1a18] transition-colors hover:text-[#1b6b4a]"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <Plus
                      className={[
                        'h-[18px] w-[18px] shrink-0 text-[#8a8a80] transition-transform duration-300',
                        isOpen ? 'rotate-45' : '',
                      ].join(' ')}
                    />
                  </button>
                  <div
                    className={[
                      'grid transition-all duration-300 ease-out',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    ].join(' ')}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-[13px] font-light leading-7 text-[#5c5c55]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-t border-[rgba(0,0,0,0.07)] bg-white px-6 py-[72px] text-center md:px-8">
          <h2 className="text-[32px] leading-none tracking-[-0.03em]">
            Ready to get 75 hours back every month?
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[8px] bg-[#1b6b4a] px-8 py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#155c3e]"
            >
              Request access
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-transparent px-8 py-3 text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f9f8f5]"
            >
              View demo
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
