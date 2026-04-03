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
    'Book a 30-minute product demo with Renovo AI. See how end of tenancy automation works for your letting agency.',
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
            A 30-minute walkthrough of the platform, tailored to your agency.
            Pick a time that works and we will handle the rest.
          </p>
        </section>

        {/* Booking embed */}
        <section className="mx-auto w-full max-w-[900px] px-6 py-12">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <iframe
              src={BOOKING_URL}
              title="Book a demo with Renovo AI"
              className="h-[680px] w-full border-0"
              loading="lazy"
              allow="clipboard-write"
            />
          </div>
        </section>

        {/* What to expect */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">What to expect</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              30 minutes. <em className="text-slate-400">No slides.</em>
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
