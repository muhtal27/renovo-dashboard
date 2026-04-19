import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

type Badge = { ic: string; t: string; d: string }

const BADGES: Badge[] = [
  { ic: 'GDPR', t: 'UK GDPR and DPA 2018', d: 'Full data subject rights. Access, erasure, and portability handled inside the statutory time limits.' },
  { ic: 'ICO', t: 'ICO registered', d: "Information Commissioner's Office registration ZC112030. Renewed every year." },
  { ic: 'UK', t: 'Data in London', d: 'Supabase on AWS eu-west-2. Vercel frontend routed through London edge. Automated daily backups.' },
  { ic: 'AES', t: 'Encrypted everywhere', d: 'TLS in transit, AES-256 at rest. Tokens, session credentials, and API keys use least privilege.' },
]

type Pillar = { title: string; intro: string; bullets: string[] }

const PILLARS: Pillar[] = [
  {
    title: 'Your data is yours.',
    intro:
      'You stay the data controller. We act as your processor. Tenancy data processed by AI is never used to train models and never shared outside Renovo.',
    bullets: [
      'Per workspace database isolation',
      'Three year default retention, custom on Enterprise',
      'Deletion inside 90 days of contract end',
    ],
  },
  {
    title: 'Every decision is logged.',
    intro:
      'Every AI draft, every manager edit, every liability reassignment is logged with actor, timestamp, and reason. Records cannot be edited or deleted inside the workspace.',
    bullets: [
      'Tamper evident case history',
      'Replayable to any point in time',
      'Exportable as a signed PDF for adjudication',
    ],
  },
  {
    title: 'Access is controlled.',
    intro:
      'Role-based permissions with manager sign-off. Property managers see their assigned cases. Branch managers see the whole portfolio. Sessions time out automatically. Enterprise customers use single sign-on.',
    bullets: [
      'Single sign-on via Microsoft Entra ID (Enterprise)',
      'Least privilege API tokens',
      'Responsible disclosure to security@renovoai.co.uk',
    ],
  },
]

const reportItems = [
  'A clear summary of the issue and the affected area',
  'Steps to reproduce, including any required account state',
  'The security impact and what data or function is exposed',
  'Screenshots, requests, or proof-of-concept details where useful',
] as const

const scopeItems = [
  'The Renovo AI web application and public website routes we operate',
  'Authentication and authorization weaknesses, including access control bypass',
  'Data exposure affecting customer, tenancy, property, or operational records',
  'API endpoints that expose sensitive actions, data, or trust boundaries',
] as const

const outOfScopeItems = [
  'Social engineering, phishing, or attempts to target staff, users, or partners',
  'Physical attacks against offices, devices, or network infrastructure',
  'Denial-of-service or distributed denial-of-service testing',
  'Automated scanner output sent without proof of impact or a reproducible finding',
  'Vulnerabilities in third-party products, integrations, or platforms we do not control',
] as const

const disclosureGuidelines = [
  'Act in good faith and avoid privacy violations, service disruption, or data destruction.',
  'Do not access, modify, or retain more data than needed to demonstrate the issue.',
  'Do not publicly disclose a finding until Renovo has had a reasonable opportunity to investigate and remediate it.',
  'Stop testing and contact us immediately if you believe you have reached sensitive live data.',
] as const

export const metadata = createMarketingMetadata({
  title: 'Security | Renovo AI',
  description:
    'UK hosted, audit first, humans decide. How Renovo AI protects customer data, compliance posture, and responsible disclosure policy.',
  path: '/security',
})

export default function SecurityPage() {
  return (
    <MarketingShell currentPath="/security">
      <div className="page-shell page-stack">
        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">Security and compliance</p>
          <h1 className="page-title max-w-[820px]">
            UK hosted. Audit first. <em className="text-slate-400">Humans decide.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            Every workspace is isolated at database level. Every action is timestamped and attributed. Tenancy data processed by AI is never used for model training and never shared outside Renovo.
          </p>
        </section>

        {/* COMPLIANCE BADGES */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BADGES.map((b) => (
              <div key={b.ic} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-50 font-mono text-[11px] font-semibold tracking-tight text-emerald-700">
                  {b.ic}
                </div>
                <div className="text-[14px] font-semibold text-zinc-950">{b.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* THREE PILLARS */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-7">
                <h3 className="text-[17px] font-semibold leading-tight text-zinc-950">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.intro}</p>
                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* DISCLOSURE HEADER CARD */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="app-kicker">Responsible disclosure</p>
              <div className="mt-2 text-[17px] font-semibold text-zinc-950">
                Found a vulnerability? Tell us directly.
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Email{' '}
                <a className="font-medium text-emerald-700 underline decoration-emerald-200 underline-offset-2 hover:decoration-emerald-500" href="mailto:security@renovoai.co.uk">
                  security@renovoai.co.uk
                </a>{' '}
                with the steps to reproduce, the affected endpoints, and the security impact. We triage inside four working hours and fix critical issues quickly.
              </p>
            </div>
            <a
              href="mailto:security@renovoai.co.uk"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              Email security team &rarr;
            </a>
          </div>
        </section>

        {/* DISCLOSURE POLICY DETAIL */}
        <div className="mx-auto w-full max-w-[780px]">
          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">How to report</h2>
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold text-zinc-950">Email</p>
              <a
                href="mailto:security@renovoai.co.uk"
                className="mt-2 inline-block text-base font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4"
              >
                security@renovoai.co.uk
              </a>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                Please include enough detail for the report to be triaged without follow-up guesswork.
              </p>
              <ul className="mt-4 space-y-3">
                {reportItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Scope</h2>
            <ul className="mt-6 space-y-4">
              {scopeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Out of scope</h2>
            <ul className="mt-6 space-y-4">
              {outOfScopeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Compensation</h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                Renovo may offer compensation for qualifying reports where the finding is original,
                actionable, and materially improves the security of the platform.
              </p>
              <p>
                Compensation is discretionary and based on severity, impact, report quality, and
                the clarity of the supporting evidence. Submission of a report does not create an
                automatic right to payment.
              </p>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Disclosure guidelines</h2>
            <ul className="mt-6 space-y-4">
              {disclosureGuidelines.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* PROCUREMENT CTA */}
          <section className="page-section-compact pb-0">
            <div className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="app-kicker">Procurement review?</p>
                <h2 className="mt-3 text-[clamp(1.25rem,2.5vw,1.5rem)] leading-tight text-zinc-950">
                  Send your security team our way.
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  We return DPA, pre-filled questionnaire, and compliance details same business day for Portfolio 365+ customers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="mailto:security@renovoai.co.uk"
                  className="app-primary-button rounded-md px-5 py-2.5 text-sm font-medium"
                >
                  Email security team
                </a>
                <Link
                  href="/book-demo"
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                >
                  Book a technical demo
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
