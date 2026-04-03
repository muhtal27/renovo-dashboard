import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const BOOKING_URL =
  'https://outlook.office.com/bookwithme/user/df0b78278c634989bd8642429b4df279@renovoai.co.uk/meetingtype/MuagrXaeKESc8zQc19w-MA2?anonymous&ep=mlink'

const expectations = [
  {
    title: 'Your workflow, not a generic walkthrough',
    body: 'We tailor the demo to your portfolio size, team structure, and the checkout process you already follow.',
  },
  {
    title: 'Evidence review and liability assessment',
    body: 'See how Renovo AI compares check-in and checkout evidence, flags condition changes, and drafts a proportionate deduction position.',
  },
  {
    title: 'Manager approval and audit trail',
    body: 'Every recommendation requires sign-off. We will show you the review workflow, edit history, and case-level audit trail.',
  },
  {
    title: 'Dispute preparation',
    body: 'If a case is referred to TDS, DPS, mydeposits, or SafeDeposits Scotland, the evidence pack is already assembled.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Book a Demo | Renovo AI',
  description:
    'Book a 45-minute product demo with Renovo AI. See how end of tenancy automation works for your letting agency.',
  path: '/book-demo',
})

export default function BookDemoPage() {
  return (
    <MarketingShell currentPath="/book-demo">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Book a demo</p>
          <h1 className="page-title max-w-[820px]">
            See Renovo AI on <em className="text-slate-400">your terms</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            A 45-minute walkthrough of the platform, tailored to your agency.
            Pick a time that works and we will handle the rest.
          </p>
        </section>

        {/* Booking CTA */}
        <section className="mx-auto w-full max-w-[640px] px-6 py-12">
          <div className="rounded-xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-500">45 minutes · Microsoft Teams</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950">
              Pick a time that works for you
            </h2>
            <p className="mx-auto mt-3 max-w-[420px] text-sm leading-7 text-slate-500">
              Choose a slot from our calendar. You will receive a Teams meeting
              link and a calendar invite immediately.
            </p>
            <div className="mt-8">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-primary-button inline-block rounded-md px-8 py-3.5 text-sm font-medium"
              >
                Choose a time &rarr;
              </a>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              Opens Microsoft Bookings in a new tab
            </p>
          </div>
        </section>

        {/* What to expect */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">What to expect</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              45 minutes. <em className="text-slate-400">No slides.</em>
            </h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-slate-500">
              A live product walkthrough focused on how Renovo AI fits into
              your existing end of tenancy operations.
            </p>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {expectations.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
