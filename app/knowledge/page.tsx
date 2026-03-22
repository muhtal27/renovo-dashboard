'use client'

import { useMemo, useState } from 'react'
import { OperatorLayout } from '@/app/operator-layout'

type RegionFilter = 'all' | 'england-wales' | 'scotland'

type GuidanceArticle = {
  title: string
  category: string
  regions: RegionFilter[]
  summary: string
  examples: string[]
  evidence: string[]
  mistakes: string[]
  sourceLabel: string
  sourceHref: string
}

const LAST_REVIEWED = 'March 2026'

const CATEGORY_ITEMS = [
  'Fair wear and tear',
  'Betterment and proportionality',
  'Evidence requirements',
  'Cleaning claims',
  'Damage and redecoration',
  'Missing items',
  'Rent arrears',
  'Scheme and dispute process',
  'Scotland notes',
  'Templates and checklists',
] as const

const GUIDANCE_ARTICLES: GuidanceArticle[] = [
  {
    title: 'Fair wear and tear',
    category: 'Fair wear and tear',
    regions: ['all', 'england-wales', 'scotland'],
    summary:
      'Normal deterioration from reasonable use should not be treated as tenant-caused damage. Age, quality, tenancy length, and the number of occupants all matter when deciding whether a mark, scuff, or worn surface is ordinary use or a compensable loss.',
    examples: [
      'Flattened carpet pile in a busy walkway is usually wear and tear; a fresh stain or burn mark is more likely to be damage.',
      'Light furniture shading and minor scuffs often follow normal use over a longer tenancy; deep gouges or broken fittings point to damage.',
    ],
    evidence: [
      'Signed check in inventory with clear descriptions of age and condition.',
      'Check out report and dated photos showing the exact area now in dispute.',
      'Tenancy length, occupancy details, and any prior repair history for the item.',
    ],
    mistakes: [
      'Treating age-related decline as if the item started the tenancy new.',
      'Relying on after photos alone without a check in baseline.',
    ],
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/fair-wear-and-tear-what-is-it-and-how-is-it-applied/',
  },
  {
    title: 'Betterment',
    category: 'Betterment and proportionality',
    regions: ['all', 'england-wales', 'scotland'],
    summary:
      'A deduction should put the landlord back in the position they should reasonably have been in, not leave them with something newer or better at the tenant’s expense. Older items usually justify a reduced, proportionate award rather than full replacement cost.',
    examples: [
      'Replacing a five-year-old carpet with a brand-new one rarely supports a full claim for the total invoice.',
      'If cleaning could solve the issue, a claim for full replacement will often be hard to justify.',
    ],
    evidence: [
      'Age and original quality of the item.',
      'Invoices or quotes showing repair versus replacement options.',
      'Photos and reports explaining why a cheaper remedy would not work.',
    ],
    mistakes: [
      'Claiming new-for-old costs without any allowance for age or lifespan.',
      'Skipping evidence on why replacement was necessary instead of repair or cleaning.',
    ],
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/rules-of-claiming-for-deposit-deductions/',
  },
  {
    title: 'Evidence checklist',
    category: 'Evidence requirements',
    regions: ['all', 'england-wales', 'scotland'],
    summary:
      'Strong deposit decisions are usually document-led. Schemes expect evidence that is specific to the disputed issue and easy to match back to the tenancy, the item, and the claimed amount.',
    examples: [
      'A rent arrears claim is stronger when the statement clearly shows the person, property, period, and balance calculation.',
      'Damage claims are easier to defend when photos are dated and tied to a room, item, and report entry.',
    ],
    evidence: [
      'Tenancy agreement, signed check in inventory, and check out report.',
      'Dated photos, invoices or quotes, and a rent statement if arrears are part of the claim.',
      'Relevant correspondence or notes only, not a full inbox export.',
    ],
    mistakes: [
      'Submitting large bundles of irrelevant material that do not relate to the issue in dispute.',
      'Using unlabeled photos with no explanation of what the adjudicator is meant to see.',
    ],
    sourceLabel: 'DPS',
    sourceHref:
      'https://www.depositprotection.com/disputes/how-to-have-a-successful-tenancy-from-start-to-finish/gathering-evidence',
  },
  {
    title: 'Deposit dispute process',
    category: 'Scheme and dispute process',
    regions: ['england-wales'],
    summary:
      'In England and Wales, deposit schemes offer free dispute resolution when the parties cannot agree on deductions. The decision turns heavily on the written evidence, so a thin file is usually harder to defend than a well-linked case pack.',
    examples: [
      'If a landlord and tenant disagree about cleaning or damage, both sides can submit documentary evidence to the scheme.',
      'A claim with clear reports, dated photos, and invoices is easier to assess than a broad narrative with no supporting documents.',
    ],
    evidence: [
      'The proposed repayment split and the reason for each deduction.',
      'Issue-specific reports, photos, invoices, and any relevant tenancy clauses.',
      'A clean chronology of what happened at the end of the tenancy.',
    ],
    mistakes: [
      'Assuming the scheme will ask for missing evidence later.',
      'Raising a dispute without first organising the evidence by issue and amount.',
    ],
    sourceLabel: 'TDS',
    sourceHref:
      'https://custodial.tenancydepositscheme.com/tools-and-guides/faqs/tenants/what-evidence-do-i-need-to-submit/',
  },
  {
    title: 'Compliance basics',
    category: 'Scheme and dispute process',
    regions: ['england-wales'],
    summary:
      'Deposit protection details are not just admin. In England and Wales the deposit must be protected promptly and the tenant must receive the prescribed information, including scheme details and how disputes are handled.',
    examples: [
      'At tenancy end, scheme name and reference details make it far easier to move quickly into repayment or dispute resolution.',
      'Missing prescribed information can complicate the landlord position before any deduction is even assessed.',
    ],
    evidence: [
      'Deposit protection certificate or confirmation.',
      'Date the deposit was received and date it was protected.',
      'Copy of the prescribed information pack given to the tenant.',
    ],
    mistakes: [
      'Treating deposit scheme details as separate from the end-of-tenancy file.',
      'Starting a claim without confirming the scheme record and prescribed information trail.',
    ],
    sourceLabel: 'GOV.UK',
    sourceHref: 'https://www.gov.uk/tenancy-deposit-protection/information-landlords-must-give-tenants',
  },
  {
    title: 'Scotland notes',
    category: 'Scotland notes',
    regions: ['scotland'],
    summary:
      'Scottish tenancy deposit processes follow Scotland-specific scheme rules. Managers should check the approved Scottish scheme guidance and use the tenancy location as the starting point before applying any end-of-tenancy process assumptions from England and Wales.',
    examples: [
      'The approved scheme and return process should be checked against the Scottish scheme record before deductions are proposed.',
      'Scotland-specific timing and information requirements should be confirmed from the official guidance for the tenancy.',
    ],
    evidence: [
      'Deposit protection confirmation showing the Scottish approved scheme used.',
      'Tenancy location, tenancy start date, and any scheme correspondence about return or dispute steps.',
      'The same core tenancy evidence pack: agreement, inventories, check out report, dated photos, and invoices where relevant.',
    ],
    mistakes: [
      'Assuming England and Wales scheme steps apply unchanged to a Scottish tenancy.',
      'Proceeding without checking the official Scottish scheme guidance for the tenancy location.',
    ],
    sourceLabel: 'mygov.scot',
    sourceHref: 'https://www.mygov.scot/landlord-deposit/protection',
  },
]

function getSourceTone(label: string) {
  switch (label) {
    case 'GOV.UK':
      return 'border border-stone-300 bg-stone-100 text-stone-700'
    case 'TDS':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'DPS':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'mydeposits':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border border-stone-200 bg-stone-50 text-stone-700'
  }
}

export default function KnowledgePage() {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')

  const visibleArticles = useMemo(
    () =>
      GUIDANCE_ARTICLES.filter((article) =>
        regionFilter === 'all' ? true : article.regions.includes(regionFilter)
      ),
    [regionFilter]
  )

  return (
    <OperatorLayout
      pageTitle="Knowledge"
      pageDescription="Practical guidance for fairer end-of-tenancy and deposit claim decisions."
    >
      <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl rounded-[1.45rem] border border-emerald-200 bg-emerald-50/85 px-5 py-4 text-sm leading-7 text-emerald-950/85">
            Rules and scheme processes vary by UK nation. Always check the official scheme
            guidance for the tenancy location.
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All guidance' },
              { value: 'england-wales', label: 'England & Wales' },
              { value: 'scotland', label: 'Scotland' },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setRegionFilter(filter.value as RegionFilter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  regionFilter === filter.value
                    ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                    : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-white hover:text-stone-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="app-kicker">Categories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Guidance topics for deposit-claim review
            </h2>
          </div>
          <p className="hidden text-sm text-stone-500 md:block">
            Filtered for{' '}
            {regionFilter === 'all'
              ? 'all UK guidance'
              : regionFilter === 'england-wales'
                ? 'England & Wales'
                : 'Scotland'}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {CATEGORY_ITEMS.map((item) => (
            <article
              key={item}
              className="rounded-[1.35rem] border border-stone-200 bg-white/92 px-4 py-4"
            >
              <p className="text-sm font-medium text-stone-800">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {visibleArticles.map((article) => (
          <article key={article.title} className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="app-kicker">{article.category}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                  {article.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceTone(article.sourceLabel)}`}
                >
                  {article.sourceLabel}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-500">
                  Last reviewed {LAST_REVIEWED}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-stone-600">{article.summary}</p>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Practical examples
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-600">
                  {article.examples.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                  What evidence to gather
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-600">
                  {article.evidence.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Common mistakes
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-600">
                  {article.mistakes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="app-divider my-6" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-stone-500">
                Source guidance summary for property manager use
              </span>
              <a
                href={article.sourceHref}
                target="_blank"
                rel="noreferrer"
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
              >
                Open source
              </a>
            </div>
          </article>
        ))}
      </section>
    </OperatorLayout>
  )
}
