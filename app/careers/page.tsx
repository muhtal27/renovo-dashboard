import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const values = [
  {
    title: 'Substance over signal',
    body: 'We care about what actually ships, not how it looks in a standup. Clear thinking, honest assessment, and real output matter more than process theatre.',
  },
  {
    title: 'Own the problem',
    body: 'Everyone here works close to the customer and close to the product. If something is broken, you fix it. If something is unclear, you ask. No waiting for permission.',
  },
  {
    title: 'Small team, high trust',
    body: 'We operate with minimal hierarchy and maximum context. You will know why decisions are being made and have a direct say in how the product evolves.',
  },
  {
    title: 'Build for the long term',
    body: 'We are solving a real operational problem for a real industry. The work compounds — better systems, better workflows, better outcomes for the teams that rely on us.',
  },
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
        <section className="page-hero">
          <p className="app-kicker">Careers</p>
          <h1 className="page-title max-w-[820px]">
            Build something that <em className="text-slate-400">matters</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI is automating end of tenancy operations for UK letting agencies and
            property managers. We are a small, focused team solving a real problem in an
            industry that has been underserved by technology.
          </p>
        </section>

        {/* Values */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">How we work</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              What we <em className="text-slate-400">value</em>
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {values.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open roles */}
        <section className="mx-auto max-w-[780px] px-6 py-24">
          <p className="app-kicker">Open roles</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Current <em className="text-slate-400">opportunities</em>
          </h2>
          <p className="mt-5 max-w-[560px] text-base leading-8 text-slate-500">
            We don't have open roles listed right now, but we are always interested in
            hearing from people who think they could contribute. If you have relevant
            experience and want to work on this problem, get in touch.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get in touch
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
