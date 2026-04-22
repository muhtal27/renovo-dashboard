import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Changelog. Renovo AI',
  description:
    'What shipped, and when. Every material product change, tagged with a version and a date.',
  path: '/changelog',
})

type ClTag = 'api' | 'workspace' | 'integration' | 'ui' | 'ops'

type Entry = {
  version: string
  date?: string
  tags: ClTag[]
  body: string
}

const CURRENT: Entry[] = [
  {
    version: 'v1.28.3',
    date: '17 Apr 2026',
    tags: ['workspace', 'ui'],
    body: 'Expanded the interactive demo with Intelligence, Adjudication Bundle, and workspace rewrites.',
  },
  {
    version: 'v1.28.2',
    date: '17 Apr 2026',
    tags: ['integration', 'api'],
    body: 'Street.co.uk launch page now connects straight through to the OAuth flow.',
  },
  {
    version: 'v1.28.1',
    date: '16 Apr 2026',
    tags: ['ui'],
    body: 'Restored missing public assets (logo, icon, open graph image).',
  },
  {
    version: 'v1.28.0',
    date: '15 Apr 2026',
    tags: ['workspace'],
    body: 'Case route wired to the new seven-step end of tenancy workspace.',
  },
  {
    version: 'v1.27.3',
    date: '15 Apr 2026',
    tags: ['workspace', 'api'],
    body: 'Workspace persistence, evidence upload, and audit logging wired to Supabase.',
  },
  {
    version: 'v1.27.2',
    date: '14 Apr 2026',
    tags: ['ui'],
    body: 'Removed tenant and landlord portal tabs from the communications hub.',
  },
  {
    version: 'v1.27.1',
    date: '14 Apr 2026',
    tags: ['ui'],
    body: 'Communications page visual alignment and removal of legacy patterns.',
  },
  {
    version: 'v1.27.0',
    date: '14 Apr 2026',
    tags: ['ops'],
    body: 'Added PostHog server module and instrumentation client.',
  },
]

const EARLIER: Entry[] = [
  {
    version: 'v1.26.x',
    tags: ['ui'],
    body: 'Dashboard parity updates, animated statistics.',
  },
  {
    version: 'v1.25.x',
    tags: ['ui', 'workspace'],
    body: 'Comprehensive HTML design overhaul across all operator pages.',
  },
  {
    version: 'v1.24.x',
    tags: ['ui'],
    body: 'Design system alignment and chart improvements.',
  },
  {
    version: 'v1.22.x',
    tags: ['ui'],
    body: 'Communications Centre rebuild, major UI modernisation.',
  },
]

const TAG_LABELS: Record<ClTag, string> = {
  workspace: 'Workspace',
  api: 'API',
  integration: 'Integration',
  ui: 'UI',
  ops: 'Ops',
}

function countTag(tag: ClTag | 'all'): number {
  const all = [...CURRENT, ...EARLIER]
  if (tag === 'all') return all.length
  return all.filter((e) => e.tags.includes(tag)).length
}

function ChangelogEntry({ entry }: { entry: Entry }) {
  return (
    <div className="cl-entry" data-cl-tags={entry.tags.join(' ')}>
      <div className="cl-entry-head">
        <span className="cl-version">{entry.version}</span>
        {entry.date && <span className="cl-date">{entry.date}</span>}
        {entry.tags.map((t) => (
          <span key={t} className={`cl-tag cl-tag-${t}`}>
            {TAG_LABELS[t]}
          </span>
        ))}
      </div>
      <div className="cl-entry-body">{entry.body}</div>
    </div>
  )
}

export default function ChangelogPage() {
  return (
    <MarketingShell currentPath="/changelog">
      <section className="page-hero">
        <p className="kicker">Changelog</p>
        <h1 className="reveal">
          What shipped,
          <br />
          <span className="accent">and when.</span>
        </h1>
        <p className="page-hero-sub reveal reveal-d1">
          Every material product change, tagged with a version and a date. Breaking changes and API additions are called out so integration partners have time to plan.
        </p>
        <div className="tag-filters reveal reveal-d2" data-filter-scope="changelog">
          <button type="button" className="tag-chip active" data-tag="all">
            All<span className="c">{countTag('all')}</span>
          </button>
          {(['workspace', 'api', 'integration', 'ui', 'ops'] as ClTag[]).map((t) => (
            <button key={t} type="button" className="tag-chip" data-tag={t}>
              {TAG_LABELS[t]}
              <span className="c">{countTag(t)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section first">
        <div className="content-card reveal">
          <div className="content-k">April 2026</div>
          <h3>v1.28 series. Workspace rewrite, CRM OAuth, demo expansion.</h3>
          <div className="cl-list">
            {CURRENT.map((e) => (
              <ChangelogEntry key={e.version} entry={e} />
            ))}
          </div>
        </div>

        <div className="content-card reveal reveal-d1" style={{ marginTop: 16 }}>
          <div className="content-k">Earlier in April 2026</div>
          <h3>v1.22 through v1.26. UI modernisation sweep.</h3>
          <div className="cl-list">
            {EARLIER.map((e) => (
              <ChangelogEntry key={e.version} entry={e} />
            ))}
          </div>
          <div className="content-contact">
            Older entries available on request. Subscribe to release notes by booking a demo.
          </div>
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
