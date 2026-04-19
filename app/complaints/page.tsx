import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const complaintSteps = [
  {
    title: 'Contact us directly',
    body: 'If you are unhappy with any aspect of our service, please contact us first at complaints@renovoai.co.uk. We will acknowledge your complaint within two working days.',
  },
  {
    title: 'Investigation',
    body: 'We will review your complaint fairly and thoroughly. Where possible, we aim to resolve complaints within ten working days. If we need longer, we will let you know and keep you updated on progress.',
  },
  {
    title: 'Resolution',
    body: 'Once our review is complete, we will write to you with the outcome, any actions we have taken, and an explanation of our decision.',
  },
  {
    title: 'If you remain unsatisfied',
    body: 'If you are not satisfied with our response, you may escalate your concern to the Information Commissioner\u2019s Office (ICO) if it relates to how we handle personal data.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Complaints | Renovo AI',
  description:
    'How to raise a complaint with Renovo AI and what to expect from our complaints process.',
  path: '/complaints',
})

export default function ComplaintsPage() {
  return (
    <MarketingShell currentPath="/complaints">
      <div className="page-shell page-stack">

        <section className="page-hero">
          <p className="app-kicker">Complaints procedure</p>
          <h1 className="page-title max-w-[820px]">
            Something gone wrong? <em className="text-white/45">Tell us directly.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            We take every complaint seriously, whether it is about the platform, a billing issue, a support experience, or a data handling concern. This page sets out how to raise one, what we will do, and how long it will take.
          </p>
        </section>

        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How it works</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Our complaints <em className="text-white/45">process</em>
          </h2>
          <div className="mt-14 divide-y divide-white/10">
            {complaintSteps.map((step, index) => (
              <div key={step.title} className="grid gap-2 py-5 md:grid-cols-[220px_1fr]">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-emerald-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </div>
                <p className="text-sm leading-7 text-white/55">
                  {step.title === 'Contact us directly' ? (
                    <>
                      If you are unhappy with any aspect of our service, please contact us first at{' '}
                      <a
                        href="mailto:complaints@renovoai.co.uk"
                        className="text-emerald-300 hover:underline"
                      >
                        complaints@renovoai.co.uk
                      </a>
                      . We will acknowledge your complaint within two working days.
                    </>
                  ) : (
                    step.body
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Escalation</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Information Commissioner&apos;s <em className="text-white/45">Office</em>
            </h2>
            <p className="mt-6 max-w-[640px] text-sm leading-7 text-white/55">
              If your complaint relates to how we handle personal data and you are not
              satisfied with our response, you have the right to complain to the ICO.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-y-6 md:grid-cols-4">
              {[
                { l: 'Organisation', v: 'Information Commissioner\u2019s Office' },
                { l: 'Website', v: 'ico.org.uk' },
                { l: 'Phone', v: '0303 123 1113' },
                { l: 'Our ICO reference', v: 'ZC112030' },
              ].map((d) => (
                <div key={d.l}>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/45">{d.l}</p>
                  <p className="mt-2 text-sm text-white/75">{d.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Need to <em className="text-white/45">get in touch</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-white/55">
            Contact us directly or review our compliance and privacy pages for more detail.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Contact us &rarr;</Link>
            <Link href="/compliance" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View compliance</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
