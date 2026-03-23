import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, LayoutPanelTop, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import { MarketingShell } from '@/app/components/MarketingShell'

const problemStats = [
  {
    stat: '3–4 hours',
    label: 'Average time spent per end of tenancy case',
  },
  {
    stat: '£1,175',
    label: 'Average UK deposit value at risk without proper documentation',
  },
  {
    stat: '1 in 3',
    label: 'Deposit disputes that could be avoided with better evidence trails',
  },
] as const

const principles = [
  {
    icon: ShieldCheck,
    title: 'Managers stay in control',
    body: 'Renovo drafts the recommendation — a manager still reviews the evidence, checks the reasoning, and approves the outcome. Automation should support decisions, not replace them.',
  },
  {
    icon: LinkIcon,
    title: 'Evidence over memory',
    body: 'Every claim amount stays linked to the issue and the source document that supports it. When a case is challenged, the reasoning is already attached — not rebuilt from an inbox.',
  },
  {
    icon: LayoutPanelTop,
    title: 'Built for the real workflow',
    body: 'Not how software thinks property management works — but how it actually works. Gather evidence, assess issues, draft the decision, get it approved, output the claim.',
  },
] as const

const partnerSlots = ['MyDeposits', 'TDS', 'Your PMS', 'More coming'] as const

export const metadata: Metadata = {
  title: 'About | Renovo',
  description:
    'Learn who built Renovo, the problem it solves, and why it was built for evidence-led end-of-tenancy decisions.',
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
              About Renovo
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Built by a property manager who got tired of rebuilding the same case from scratch.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-stone-600">
              I manage end of tenancy properties in Edinburgh. Every checkout meant the same thing
              — hours rebuilding a case from emails, PDFs, and memory, hoping the documentation
              would hold up if challenged. I built Renovo because that process was broken and
              nothing on the market was built to fix it.
            </p>
          </section>

          <section>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                The problem every property manager knows
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {problemStats.map((item) => (
                <article
                  key={item.label}
                  className="rounded-3xl border border-stone-200 bg-white/92 p-6 text-center shadow-[0_18px_40px_rgba(55,43,27,0.08)]"
                >
                  <p className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                    {item.stat}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-500">{item.label}</p>
                </article>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-4xl text-center text-base leading-8 text-stone-600">
              Existing property management tools handle rent collection, maintenance, and
              tenancies. None of them are built specifically for the end of tenancy decision — the
              moment where documentation, evidence, and defensible reasoning matter most. That&apos;s
              the gap Renovo fills.
            </p>
          </section>

          <section>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  Who&apos;s behind Renovo
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
                  Muhammad has worked as an end of tenancy property manager in Edinburgh for years
                  — managing the full checkout cycle, deposit documentation, and claim decisions
                  firsthand. He built Renovo after experiencing the same broken process on repeat:
                  cross-referencing check-in and check-out documents manually, rebuilding the
                  reasoning from memory, and hoping the paper trail would hold up when a landlord
                  or tenant pushed back. Renovo is the tool he needed and couldn&apos;t find.
                </p>

                <blockquote className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-5 py-4 text-base leading-8 text-stone-700">
                  <p>
                    “I didn&apos;t build this because I spotted a market opportunity. I built it
                    because I was doing this job every week and it was taking far too long.”
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
                Our principles
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
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Where we&apos;re going
              </h2>
              <p className="mx-auto mt-6 max-w-4xl text-base leading-8 text-stone-600">
                Renovo is starting with the end of tenancy decision — the most
                documentation-heavy, dispute-prone moment in any tenancy lifecycle. Changes in
                England under the Renters&apos; Rights Act, alongside rising documentation
                expectations across the wider market, are making evidence-led decisions more
                important than ever for property managers and letting agencies. Our goal is to
                become the standard for how end of tenancy decisions are made, reviewed, and
                defended across letting agencies — starting in Scotland and growing from there.
              </p>
            </div>
          </section>

          <section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  Join the team
                </h2>
                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-600">
                  Renovo is early stage and growing. We&apos;re looking for people who care about
                  property, love building things that solve real problems, and want to work on
                  something that genuinely makes a hard job easier.
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <h3 className="text-xl font-semibold text-stone-900">Interested in joining us?</h3>
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  We don&apos;t have open roles listed yet — but we&apos;re always open to
                  conversations with the right people. If you&apos;re a developer, designer, or
                  property professional who wants to be part of what we&apos;re building, get in
                  touch.
                </p>
                <Link
                  href="mailto:hello@renovoai.co.uk"
                  className="mt-6 inline-flex items-center text-sm font-medium text-amber-700 transition-colors hover:text-amber-800"
                >
                  Send us a message →
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Built to work alongside your existing stack
              </h2>
              <p className="mt-4 text-base leading-8 text-stone-500">
                Renovo sits alongside your current property management system from day one.
              </p>
            </div>

            {/* Replace these placeholder slots once partnerships are confirmed. */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {partnerSlots.map((item) => (
                <div
                  key={item}
                  className="flex h-20 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 px-4 text-sm font-medium text-stone-400 opacity-75 grayscale"
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
                  Property manager?
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  See how Renovo fits your workflow.
                </h2>
                <Link
                  href="/#waitlist"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
                >
                  Request Early Access
                </Link>
              </article>

              <article className="rounded-3xl border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Investor or partner?
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  We&apos;d love to tell you more.
                </h2>
                <Link
                  href="mailto:hello@renovoai.co.uk"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  Get in touch
                </Link>
              </article>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
