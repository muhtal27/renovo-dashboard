import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, LayoutPanelTop, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import { MarketingShell } from '@/app/components/MarketingShell'

const problemSignals = [
  {
    stat: 'Fragmented workflow',
    label: 'End-of-tenancy work still sits across reports, photos, email, and memory in many agencies.',
  },
  {
    stat: 'High-volume turnover',
    label: 'Tenancy ends create repeat operational work that becomes harder to manage as portfolios grow.',
  },
  {
    stat: 'Evidence matters',
    label: 'Claims are stronger when the write-up, reasoning, and source evidence stay together.',
  },
] as const

const principles = [
  {
    icon: ShieldCheck,
    title: 'Managers stay in control',
    body: 'Renovo prepares the review, but a manager still checks the evidence, applies judgement, and approves the outcome.',
  },
  {
    icon: LinkIcon,
    title: 'Evidence over memory',
    body: 'Each claim item stays linked to the underlying report entries, photos, and notes, so the reasoning does not need to be rebuilt later.',
  },
  {
    icon: LayoutPanelTop,
    title: 'Built for the real workflow',
    body: 'Renovo automates the core end-of-tenancy workflow, from evidence review to claim preparation.',
  },
] as const

const partnerAreas = [
  'Inventory and inspection systems',
  'Property management software',
  'Claim and dispute preparation workflows',
  'Strategic channel relationships',
] as const

const stageItems = [
  'Pre-seed',
  'Product built',
  'Early access open',
  'Pilot and partnership conversations underway',
] as const

export const metadata: Metadata = {
  title: 'Company & Investors | Renovo',
  description:
    'Learn how Renovo automates end-of-tenancy work for UK property managers and why the company is focused on evidence-led workflow automation.',
  alternates: {
    canonical: 'https://renovoai.co.uk/about',
  },
}

export default function AboutPage() {
  return (
    <MarketingShell currentPath="/about">
      <div className="rounded-[2.45rem] bg-[linear-gradient(180deg,rgba(250,247,242,0.82),rgba(255,255,255,0.95))] px-4 py-6 text-stone-900 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl space-y-20 px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <section className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Company
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Renovo automates end-of-tenancy work for UK property managers
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-stone-600">
              Renovo was built from direct operational experience of the checkout process: reviewing
              evidence, judging fair wear and tear, preparing claims, and trying to keep the audit
              trail intact when a case is challenged.
            </p>
          </section>

          <section>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                The company thesis
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {problemSignals.map((item) => (
                <article
                  key={item.label}
                  className="rounded-3xl border border-stone-200 bg-white/92 p-6 text-center shadow-[0_18px_40px_rgba(55,43,27,0.08)]"
                >
                  <p className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                    {item.stat}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-500">{item.label}</p>
                </article>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-4xl text-center text-base leading-8 text-stone-600">
              The UK lettings market has a standardised deposit protection framework, but much of
              the end-of-tenancy work around it is still handled manually. Renovo is focused on the
              operational gap between evidence collection and claim preparation.
            </p>
          </section>

          <section>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  Founder
                </h2>
                <div className="mt-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),rgba(255,255,255,0.82)_35%,rgba(255,251,235,0.94)_70%)] p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(250,247,242,0.94))]">
                    <Image
                      src="/muhammad-munawar-headshot.jpg"
                      alt="Muhammad Munawar"
                      fill
                      className="object-cover object-center"
                      sizes="(min-width: 1024px) 32vw, 100vw"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/24 to-transparent" />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)] md:p-8">
                <p className="text-2xl font-semibold text-stone-900">Muhammad Munawar</p>
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Founder &amp; CEO, Renovo
                </p>
                <p className="mt-6 text-base leading-8 text-stone-600">
                  Muhammad has worked in end-of-tenancy property management, handling checkout
                  evidence, deposit documentation, and claim preparation first-hand. Renovo grew
                  from that day-to-day experience of repeated manual comparison, inconsistent case
                  write-ups, and the difficulty of defending a claim when the reasoning is spread
                  across different files and inboxes.
                </p>

                <blockquote className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-5 py-4 text-base leading-8 text-stone-700">
                  <p>
                    “The problem was not a lack of data. It was the amount of manual work needed to
                    turn that data into a reviewable, defensible claim.”
                  </p>
                </blockquote>

                <div className="mt-6">
                  <Link
                    href="https://www.linkedin.com/in/muhtal/"
                    aria-label="Muhammad Munawar on LinkedIn"
                    className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>LinkedIn</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Product principles
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {principles.map((item) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)] transition-colors duration-200 hover:border-stone-300 hover:bg-white"
                  >
                    <div className="inline-flex rounded-2xl border border-stone-200 bg-stone-50 p-3 text-amber-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-stone-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                  </article>
                )
              })}
            </div>
          </section>

          <section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  Current stage
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-600">
                  Renovo is early, but the product direction is clear: automate the operational
                  centre of end-of-tenancy work without removing manager judgement.
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <div className="space-y-3">
                  {stageItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm font-medium text-stone-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Built to work alongside existing systems
              </h2>
              <p className="mt-4 text-base leading-8 text-stone-500">
                Renovo is designed to sit between evidence collection, internal review, and
                downstream claim or dispute workflows.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {partnerAreas.map((item) => (
                <div
                  key={item}
                  className="flex min-h-20 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 px-4 text-center text-sm font-medium text-stone-500"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))] px-6 py-7 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Operator or buyer?
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  See how Renovo fits the workflow.
                </h2>
                <Link
                  href="/demo"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
                >
                  View live demo
                </Link>
              </article>

              <article className="rounded-3xl border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Investor or strategic partner?
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  Interested in learning more?
                </h2>
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  We&apos;re happy to speak with investors, operators, and strategic partners who
                  understand the operational challenges around end-of-tenancy work.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  Contact Renovo
                </Link>
                <a
                  href="/renovo-company-one-pager.pdf"
                  download
                  className="mt-4 inline-flex items-center justify-center text-sm font-medium text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900"
                >
                  Download company one-pager
                </a>
              </article>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
