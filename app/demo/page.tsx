import {
  MarketingButton,
  MarketingCard,
  MarketingFinalCta,
  MarketingIntro,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Demo | Renovo AI'
const description =
  'View the Renovo AI read-only demo showing how checkout evidence becomes a liability assessment, deduction letter, and dispute-ready pack.'

const demoHighlights = [
  'Read-only preview using representative workflow data',
  'Shows the case structure your team would review in production',
  'Includes intake, liability assessment, decision trail, and output framing',
] as const

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/demo',
})

export default function DemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/demo',
              title,
              description,
            }),
          ]),
        }}
      />
      <MarketingShell currentPath="/demo">
        <MarketingSection>
          <div className="grid gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-end">
            <MarketingIntro
              titleAs="h1"
              eyebrow="Demo"
              title={
                <>
                  Review the Renovo workflow in a <em>read-only case preview</em>
                </>
              }
              description="This preview shows how Renovo moves from checkout evidence to liability assessment, deduction drafting, manager review, and claim-ready output without touching live customer data."
              actions={
                <>
                  <MarketingButton href="/demo" variant="secondary">
                    View demo below
                  </MarketingButton>
                  <MarketingButton href="/contact">Talk to us</MarketingButton>
                </>
              }
            />

            <MarketingCard className="rounded-[1.9rem]">
              <p className="marketing-eyebrow">What the preview shows</p>
              <div className="mt-5 grid gap-3">
                {demoHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1rem] border border-black/6 bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-7 text-[var(--text-body)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">
                Editing, approval, and submission controls are hidden in this preview. The case
                layout matches the live product structure.
              </p>
            </MarketingCard>
          </div>
        </MarketingSection>

        <MarketingSection variant="tint">
          <div className="grid gap-8">
            <div className="max-w-[46rem]">
              <p className="marketing-eyebrow">Preview frame</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] tracking-[-0.05em] text-[var(--text-strong)]">
                Product context, not a marketing montage.
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--text-body)]">
                The demo is intentionally close to the real operator experience. You can see how
                case context, evidence, draft reasoning, and next-step actions sit together on the
                same workspace surface.
              </p>
            </div>

            <MarketingCard className="rounded-[2.1rem] border-black/10 p-3 md:p-4">
              <div className="rounded-[1.7rem] border border-black/8 bg-[#0b1220] p-2 md:p-3">
                <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/52">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#26b383]" />
                  Read-only product preview
                </div>
                <div
                  className="relative w-full overflow-hidden rounded-[1.3rem] border border-white/8 bg-zinc-950"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  <iframe
                    src="https://www.loom.com/embed/0f57f8bf75a248dfb7762a4556988bd2"
                    title="Renovo demo walkthrough"
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </MarketingCard>
          </div>
        </MarketingSection>

        <MarketingSection>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                heading: 'See the operating flow',
                body: 'Understand how the product handles evidence intake, liability drafting, and case progression before your team ever signs in.',
              },
              {
                heading: 'Check the framing',
                body: 'Review the audit trail, reasoning structure, and output format that matter when claims are challenged.',
              },
              {
                heading: 'Talk through rollout',
                body: 'Use the preview as the starting point for a commercial and operational conversation about your own workflow.',
              },
            ].map((item) => (
              <MarketingCard key={item.heading} className="h-full">
                <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
              </MarketingCard>
            ))}
          </div>
        </MarketingSection>

        <MarketingFinalCta
          eyebrow="Next step"
          title={
            <>
              Want to see how this fits your <em>live operation?</em>
            </>
          }
        description="Tell us how your team currently handles checkouts, deduction letters, and disputes. We'll show you how Renovo fits that workflow."
          primaryHref="/contact"
          primaryLabel="Talk to us"
          secondaryHref="/pricing"
          secondaryLabel="View pricing"
        />
      </MarketingShell>
    </>
  )
}
