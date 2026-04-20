import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Changelog. Renovo AI',
  description:
    'What shipped, and when. Every material product change, tagged with a version and a date.',
  path: '/changelog',
})

export default function ChangelogPage() {
  return (
    <MarketingShell currentPath="/changelog">
      <section className="page-hero">
        <p className="kicker">Changelog</p>
        <h1>
          What shipped,
          <br />
          <span className="accent">and when.</span>
        </h1>
        <p className="page-hero-sub">
          Every material product change, tagged with a version and a date. Breaking changes and API additions are called out so integration partners have time to plan.
        </p>
      </section>

      <section className="section first">
        <div className="content-card">
          <div className="content-k">April 2026</div>
          <h3>v1.28 series. Workspace rewrite, Reapit OAuth, demo expansion.</h3>
          <div className="content-list">
            <div className="content-li">
              <strong>v1.28.3 (17 Apr 2026)</strong> Expanded the interactive demo with Intelligence, Adjudication Bundle, and workspace rewrites.
            </div>
            <div className="content-li">
              <strong>v1.28.2 (17 Apr 2026)</strong> Reapit AppMarket launch page now connects straight through to the OAuth flow.
            </div>
            <div className="content-li">
              <strong>v1.28.1 (16 Apr 2026)</strong> Restored missing public assets (logo, icon, open graph image).
            </div>
            <div className="content-li">
              <strong>v1.28.0 (15 Apr 2026)</strong> Case route wired to the new seven-step end of tenancy workspace.
            </div>
            <div className="content-li">
              <strong>v1.27.3 (15 Apr 2026)</strong> Workspace persistence, evidence upload, and audit logging wired to Supabase.
            </div>
            <div className="content-li">
              <strong>v1.27.2 (14 Apr 2026)</strong> Removed tenant and landlord portal tabs from the communications hub.
            </div>
            <div className="content-li">
              <strong>v1.27.1 (14 Apr 2026)</strong> Communications page visual alignment and removal of legacy patterns.
            </div>
            <div className="content-li">
              <strong>v1.27.0 (14 Apr 2026)</strong> Added PostHog server module and instrumentation client.
            </div>
          </div>
        </div>

        <div className="content-card" style={{ marginTop: 16 }}>
          <div className="content-k">Earlier in April 2026</div>
          <h3>v1.22 through v1.26. UI modernisation sweep.</h3>
          <div className="content-list">
            <div className="content-li">
              <strong>v1.26.x</strong> Dashboard parity updates, animated statistics.
            </div>
            <div className="content-li">
              <strong>v1.25.x</strong> Comprehensive HTML design overhaul across all operator pages.
            </div>
            <div className="content-li">
              <strong>v1.24.x</strong> Design system alignment and chart improvements.
            </div>
            <div className="content-li">
              <strong>v1.22.x</strong> Communications Centre rebuild, major UI modernisation.
            </div>
          </div>
          <div className="content-contact">Older entries available on request. Subscribe to release notes by booking a demo.</div>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Want release notes in your inbox?</h3>
            <p className="cta-lite-sub">
              Existing customers get monthly release notes automatically. Prospective customers can subscribe.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo
            </Link>
            <Link href="/developers" className="btn-outline">
              API reference
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
