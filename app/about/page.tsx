import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const principles = [
  {
    title: 'AI assists, humans decide',
    body: 'Every AI-generated recommendation goes through manager approval. Automation reduces admin, but judgement remains with your team.',
  },
  {
    title: 'Built for how it actually works',
    body: 'Renovo AI is shaped around real end-of-tenancy handoffs, evidence review, and dispute preparation under operational pressure.',
  },
  {
    title: 'Fair to both sides',
    body: 'Good deposit handling means reasoned, evidenced, and proportionate decisions that can be explained clearly when challenged.',
  },
] as const

export const metadata: Metadata = {
  title: 'About | Renovo AI',
  description:
    'About Renovo AI and the founder-led approach to end-of-tenancy workflow automation for UK property managers.',
  alternates: {
    canonical: 'https://renovoai.co.uk/about',
  },
}

export default function AboutPage() {
  return (
    <MarketingShell currentPath="/about">
      <section className="marketing-frame pb-10 pt-14 md:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#e1f5ee] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0f6e56]" />
          About Renovo AI
        </p>
        <h1 className="mt-6 max-w-[760px] text-[clamp(2.2rem,4.5vw,3.3rem)] leading-[1.1] tracking-[-0.02em]">
          Built by someone who has
          <br />
          <em className="not-italic text-[#9e7a2a]">done the work</em>
        </h1>
        <p className="mt-6 max-w-[700px] text-lg font-light leading-8 text-[#3d3b37]">
          Renovo AI is built in Edinburgh by a founder with direct end-of-tenancy operational
          experience, focused on turning scattered evidence and manual admin into a reviewable,
          defensible workflow.
        </p>
        <p className="mt-4 text-sm leading-7 text-[#7a7670]">
          Renovo AI Ltd · Company No. SC833544
        </p>
      </section>

      <section className="marketing-frame border-t border-[rgba(15,14,13,0.1)] py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="text-[30px] leading-[1.2]">
              Why <em className="not-italic text-[#9e7a2a]">this</em> exists
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#3d3b37]">
              <p>
                End-of-tenancy is one of the highest-admin, highest-stakes parts of property
                management. Teams still copy data between apps, draft letters manually, and rebuild
                evidence trails under deadline pressure.
              </p>
              <p>
                Renovo AI exists to centralise that operational layer: evidence intake, issue review,
                recommendation drafting, manager sign-off, and claim-ready output in one workspace.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-[30px] leading-[1.2]">
              Who is <em className="not-italic text-[#9e7a2a]">building</em> it
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#3d3b37]">
              <p>
                Renovo AI is founded by Muhammad Munawar, based in Edinburgh. The product direction
                comes from first-hand checkout review, liability assessment, and dispute handling
                experience.
              </p>
              <p>
                The company is early-stage and building with direct feedback from UK property
                managers and letting agencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-frame border-t border-[rgba(15,14,13,0.1)] py-14">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-[rgba(15,14,13,0.1)] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/muhammad-munawar-headshot.jpg"
                alt="Muhammad Munawar"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 320px, 100vw"
                priority
              />
            </div>
            <div className="p-5">
              <p className="text-lg">Muhammad Munawar</p>
              <p className="mt-1 text-sm text-[#7a7670]">Founder & CEO, Renovo AI</p>
            </div>
          </div>

          <div>
            <p className="app-kicker">What we believe</p>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.12]">
              Principles, not
              <br />
              <em className="not-italic text-[#9e7a2a]">buzzwords</em>
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {principles.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-6"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#0f6e56]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 text-lg">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#7a7670]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-frame border-t border-[rgba(15,14,13,0.1)] py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,14,13,0.1)] bg-[#f2efe9] px-3 py-1.5 text-xs font-medium text-[#7a7670]">
              Edinburgh, Scotland
            </p>
            <h2 className="mt-5 text-[30px] leading-[1.2]">Based in Edinburgh</h2>
            <p className="mt-4 text-[15px] leading-8 text-[#3d3b37]">
              Renovo AI is built in Scotland and focused on UK end-of-tenancy operating realities,
              including evidence standards and dispute preparation expectations in local workflows.
            </p>
          </div>

          <article className="overflow-hidden rounded-2xl border border-[rgba(15,14,13,0.1)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="h-44 bg-[#e8e3da]" />
            <div className="p-5">
              <p className="text-base">Renovo AI HQ</p>
              <p className="mt-1 text-sm text-[#7a7670]">Edinburgh, Scotland - renovoai.co.uk</p>
            </div>
          </article>
        </div>
      </section>

      <section className="marketing-frame border-t border-[rgba(15,14,13,0.1)] py-14 text-center">
        <h2 className="text-[30px] leading-[1.2]">
          Want to help shape
          <br />
          <em className="not-italic text-[#9e7a2a]">what we build next?</em>
        </h2>
        <p className="mx-auto mt-4 max-w-[700px] text-[15px] leading-8 text-[#3d3b37]">
          We are onboarding a small number of property managers and agencies for early access and
          feedback-led rollout.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
            Request early access
          </Link>
          <Link href="/investors" className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
            Investor information
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}
