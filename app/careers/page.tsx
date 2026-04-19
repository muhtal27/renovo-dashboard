import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const whyNow = [
  'End of tenancy is a £2B+ operational cost centre that still runs on email, Word documents, and spreadsheets.',
  'Evidence standards for deposit deductions are rising across all four schemes. Agencies need structured, defensible processes.',
  'We have a working product, paying customers, and a clear path to scale. You would be joining early enough to shape the product and the company.',
] as const

const whatWeLookFor = [
  {
    title: 'What have you built?',
    body: 'Show us something. A side project, a feature you shipped, an open source contribution, a product you launched. We want to see how you think through a problem and what you chose to do about it.',
  },
  {
    title: 'What do you care about?',
    body: 'We are not looking for people who just want a job. We want to know what pulls you in — what you read, what you tinker with, what problems you find yourself coming back to.',
  },
  {
    title: 'How do you work?',
    body: 'Tell us about a time you had to figure something out with limited information. How did you decide what to do? What did you try first? What did you learn?',
  },
  {
    title: 'Why this?',
    body: 'Property technology is not glamorous. End of tenancy is a niche most people have never thought about. If something about this problem or this company interests you, we want to hear why.',
  },
] as const

const stack = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Supabase',
  'PostgreSQL',
  'FastAPI',
  'Python',
  'Vercel',
] as const

export const metadata = createMarketingMetadata({
  title: 'Careers | Renovo AI',
  description:
    'Join Renovo AI. We are building end of tenancy automation for UK letting agencies and property managers.',
  path: '/careers',
})

export default function CareersPage() {
  return (
    <MarketingShell currentPath="/careers">
      <div className="page-shell page-stack">

        {/* Hero */}
        <section className="page-hero">
          <p className="app-kicker">Careers</p>
          <h1 className="page-title max-w-[820px]">
            No open roles right now. <em className="text-white/45">Get in touch anyway.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            We do not run on a hiring schedule. If you have built something relevant, shipped features, solved operational problems, or worked inside a regulated workflow, we want to hear from you.
          </p>
        </section>

        {/* Why now */}
        <section className="mx-auto max-w-[780px] px-6 py-24">
          <p className="app-kicker">Why now</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Timing <em className="text-white/45">matters</em>
          </h2>
          <div className="mt-10 space-y-4">
            {whyNow.map((item) => (
              <div key={item} className="flex items-start gap-3 text-base leading-8 text-white/55">
                <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* What we look for */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">What we want to know</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Tell us about <em className="text-white/45">you</em>
            </h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-white/55">
              We don&apos;t hire from CVs. We hire from conversations.
              These are the things we actually want to know.
            </p>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {whatWeLookFor.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/55">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack */}
        <section className="mx-auto max-w-[780px] px-6 py-24">
          <p className="app-kicker">What we use</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Stack
          </h2>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {stack.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80"
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Open roles */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[780px] px-6 py-24">
            <p className="app-kicker">Open roles</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Current <em className="text-white/45">openings</em>
            </h2>
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
              <p className="text-sm font-medium text-white">No open roles right now</p>
              <p className="mx-auto mt-2 max-w-[420px] text-sm leading-7 text-white/55">
                We don&apos;t hire on a schedule. When we need someone, we move
                fast. If you think you should be here, reach out anyway.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-lg font-semibold text-white">Interested?</h3>
              <p className="mt-2 max-w-[480px] text-sm leading-7 text-white/55">
                Send an email with a short note on what you would bring and
                a link to something you have built. No cover letters. No CVs
                unless you want to include one.
              </p>
              <div className="mt-6">
                <a
                  href="mailto:careers@renovoai.co.uk"
                  className="app-primary-button inline-block rounded-md px-6 py-3 text-sm font-medium"
                >
                  careers@renovoai.co.uk
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
