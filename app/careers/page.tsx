import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Careers. Renovo AI',
  description:
    'No open roles right now. Get in touch anyway. We do not run on a hiring schedule.',
  path: '/careers',
})

export default function CareersPage() {
  return (
    <MarketingShell currentPath="/careers">
      <section className="page-hero">
        <p className="kicker">Careers</p>
        <h1>
          No open roles right now.
          <br />
          <span className="accent">Get in touch anyway.</span>
        </h1>
        <p className="page-hero-sub">
          We do not run on a hiring schedule. If you have built something relevant, shipped features, solved operational problems, or worked inside a regulated workflow, we want to hear from you.
        </p>
      </section>

      <section className="section first">
        <div className="content-grid">
          <div className="content-card">
            <div className="content-k">How we hire</div>
            <h3>Conversations and evidence, not CVs.</h3>
            <p>
              Send a short note on what you&apos;d contribute, plus a link to something you&apos;ve built. We value:
            </p>
            <div className="content-list">
              <div className="content-li">Projects or features you&apos;ve shipped end-to-end</div>
              <div className="content-li">Problem-solving with incomplete information</div>
              <div className="content-li">Honest motivation for this specific role</div>
              <div className="content-li">No formal cover letter required</div>
            </div>
            <div className="content-contact">
              <a href="mailto:careers@renovoai.co.uk">careers@renovoai.co.uk</a>
            </div>
          </div>
          <div className="content-card">
            <div className="content-k">Tech stack</div>
            <h3>Boring infrastructure, deliberately chosen.</h3>
            <p>Small, senior team. Fully remote across the UK.</p>
            <div className="content-list">
              <div className="content-li">Next.js, React, TypeScript, Tailwind CSS</div>
              <div className="content-li">Supabase, PostgreSQL with row-level security</div>
              <div className="content-li">FastAPI, Python (for AI / evidence pipeline)</div>
              <div className="content-li">Vercel frontend hosting</div>
              <div className="content-li">Anthropic / Bedrock for inference</div>
              <div className="content-li">Playwright, PostHog, Sentry</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Think you&apos;d fit?</h3>
            <p className="cta-lite-sub">
              Send us a note even without an open role. The best hires find us first.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:careers@renovoai.co.uk" className="btn-primary">
              Email careers →
            </a>
            <Link href="/about" className="btn-outline">
              Read our philosophy
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
