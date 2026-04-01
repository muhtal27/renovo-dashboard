import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Demo | Renovo AI'
const description =
  'View the Renovo AI read-only demo showing how checkout evidence becomes a liability assessment, deduction letter, and dispute ready pack.'

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
        <div className="page-shell page-stack">
          <section className="page-hero">
            <p className="app-kicker">Demo</p>
            <h1 className="page-title max-w-[820px]">
              Review the Renovo AI workflow in a <em className="text-slate-400">read-only case preview</em>
            </h1>
            <p className="page-copy max-w-[640px]">
              This demo shows how Renovo AI moves from checkout evidence to liability
              assessment, deduction letter drafting, manager review, and claim ready output
              without touching live customer data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
                Get started &rarr;
              </Link>
              <Link href="/" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
                Back to homepage
              </Link>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Editing, approval, and submission controls are hidden in this preview.
              The case layout matches the live product structure.
            </p>
          </section>

          <section className="overflow-hidden rounded-xl shadow-[0_18px_48px_rgba(0,0,0,0.08)]">
            <div
              className="relative w-full overflow-hidden bg-zinc-950"
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
          </section>
        </div>
      </MarketingShell>
    </>
  )
}
