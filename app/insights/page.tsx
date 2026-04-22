import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Insights. Renovo AI',
  description:
    'Field notes from UK end of tenancy. Market research, scheme benchmarks, and practical playbooks for property managers.',
  path: '/insights',
})

type InsightTag = 'research' | 'scheme' | 'ops' | 'product'

type Post = {
  tags: InsightTag[]
  artVariant?: 'a2' | 'a3' | 'a4'
  glyph: string
  date: string
  readTime: string
  author: string
  title: string
  excerpt: string
  feature?: boolean
  stats?: Array<{ v: string; k: string }>
  footCtaLabel: string
}

const POSTS: Post[] = [
  {
    tags: ['research', 'scheme'],
    glyph: '25.6d',
    date: '15 Apr 2026',
    readTime: '9 min read',
    author: 'Muhammad · Research',
    title: 'The State of UK Deposit Disputes, 2026. What 4,200 adjudications told us.',
    excerpt:
      'We analysed every public outcome across SDS, DPS, TDS, and mydeposits over the last twelve months. The headline: agents who document reasoning win 34 percentage points more often than agents who lead with itemised costs. Here is what that means for how you write a deduction.',
    feature: true,
    stats: [
      { v: '£847', k: 'Avg disputed amount' },
      { v: '48%', k: 'Full award rate' },
      { v: '25.6d', k: 'Mean resolution' },
    ],
    footCtaLabel: 'Read report →',
  },
  {
    tags: ['ops'],
    artVariant: 'a2',
    glyph: 'FW',
    date: '08 Apr 2026',
    readTime: '6 min read',
    author: 'Rabeea · Ops',
    title: 'Fair wear and tear, unpacked. A working reference for property managers.',
    excerpt:
      "The Housing Act doesn't define it. Schemes won't adjudicate on it uniformly. But every deduction hinges on it. Tenancy length bands, depreciation factors by asset type, and the reasoning language that holds up at adjudication.",
    footCtaLabel: 'Read guide →',
  },
  {
    tags: ['research'],
    artVariant: 'a3',
    glyph: 'Σ',
    date: '01 Apr 2026',
    readTime: '5 min read',
    author: 'Muhammad · Research',
    title: 'Scotland vs England. Why SDS awards £71 more on average per dispute.',
    excerpt:
      "Cross-border operators tell us the same thing: a kitchen deep clean in Edinburgh doesn't pay out the same as a kitchen deep clean in Leeds. We pulled 18 months of paired outcomes and the gap is real — but not where you'd expect.",
    footCtaLabel: 'Read analysis →',
  },
  {
    tags: ['product'],
    artVariant: 'a4',
    glyph: 'v1.28',
    date: '17 Apr 2026',
    readTime: '4 min read',
    author: 'Muhammad · Engineering',
    title: 'What shipped in v1.28. Seven-step workspace, CRM OAuth, and the adjudication bundle.',
    excerpt:
      'The biggest workspace rewrite since launch. Cases now flow through seven named steps — Intake, Analyse, Draft, Review, Resolve, Dispute, Closed — with manager sign-off baked into each transition. Plus one-click OAuth against Alto, Jupix, and Street.co.uk, and scheme-native bundle export.',
    footCtaLabel: 'Read release →',
  },
]

const TAG_LABELS: Record<InsightTag, string> = {
  research: 'Research',
  scheme: 'Scheme',
  ops: 'Operations',
  product: 'Product',
}

const TAG_CLASS: Record<InsightTag, string> = {
  research: 'post-tag-research',
  scheme: 'post-tag-scheme',
  ops: 'post-tag-ops',
  product: 'post-tag-product',
}

function countTag(tag: InsightTag | 'all'): number {
  if (tag === 'all') return POSTS.length
  return POSTS.filter((p) => p.tags.includes(tag)).length
}

function MICRO_BAR_HEIGHTS_A(): number[] {
  return [0.4, 0.55, 0.45, 0.7, 0.65, 0.85, 0.78, 0.95, 0.88, 1]
}
function MICRO_BAR_HEIGHTS_B(): number[] {
  return [1, 0.92, 0.88, 0.74, 0.82, 0.68, 0.6, 0.55, 0.42, 0.34]
}

function FeaturePostCard({ post }: { post: Post }) {
  return (
    <article className="post-card feature reveal" data-tags={post.tags.join(' ')}>
      <div className={`post-art${post.artVariant ? ' ' + post.artVariant : ''}`}>
        <div className="post-art-glyph">{post.glyph}</div>
      </div>
      <div>
        <div className="post-meta">
          {post.tags.map((t) => (
            <span key={t} className={`post-tag ${TAG_CLASS[t]}`}>
              {TAG_LABELS[t]}
            </span>
          ))}
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
        <h3 className="post-title">{post.title}</h3>
        <p className="post-excerpt">{post.excerpt}</p>
        {post.stats && (
          <div className="post-stat-row">
            {post.stats.map((s, i) => {
              // First stat gets a 10-bar micro trend; second a 3-segment distribution;
              // third a declining 10-bar (resolution trend).
              if (i === 0) {
                return (
                  <div key={s.k} className="post-stat">
                    <div className="post-stat-v">{s.v}</div>
                    <div className="post-stat-k">{s.k}</div>
                    <div className="post-stat-micro">
                      {MICRO_BAR_HEIGHTS_A().map((h, hi) => (
                        <div key={hi} className="post-stat-micro-bar" style={{ ['--h' as string]: String(h) }} />
                      ))}
                    </div>
                  </div>
                )
              }
              if (i === 1) {
                return (
                  <div key={s.k} className="post-stat">
                    <div className="post-stat-v">{s.v}</div>
                    <div className="post-stat-k">{s.k}</div>
                    <div className="stack-bar-wrap" style={{ marginTop: 6 }}>
                      <div className="stack-bar in" style={{ height: 6 }}>
                        <div className="stack-bar-seg s-em" style={{ flex: '48 1 0%' }} />
                        <div className="stack-bar-seg s-amber" style={{ flex: '27 1 0%' }} />
                        <div className="stack-bar-seg s-rose" style={{ flex: '25 1 0%' }} />
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={s.k} className="post-stat">
                  <div className="post-stat-v">{s.v}</div>
                  <div className="post-stat-k">{s.k}</div>
                  <div className="post-stat-micro">
                    {MICRO_BAR_HEIGHTS_B().map((h, hi) => (
                      <div key={hi} className="post-stat-micro-bar" style={{ ['--h' as string]: String(h) }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="post-foot">
          <span>{post.author}</span>
          <span className="post-foot-r">{post.footCtaLabel}</span>
        </div>
      </div>
    </article>
  )
}

function StandardPostCard({ post, delay }: { post: Post; delay: number }) {
  const delayClass = delay > 0 ? ` reveal-d${delay}` : ''
  return (
    <article className={`post-card reveal${delayClass}`} data-tags={post.tags.join(' ')}>
      <div className={`post-art${post.artVariant ? ' ' + post.artVariant : ''}`}>
        <div className="post-art-glyph">{post.glyph}</div>
      </div>
      <div className="post-meta">
        {post.tags.map((t) => (
          <span key={t} className={`post-tag ${TAG_CLASS[t]}`}>
            {TAG_LABELS[t]}
          </span>
        ))}
        <span>·</span>
        <span>{post.date}</span>
        <span>·</span>
        <span>{post.readTime}</span>
      </div>
      <h3 className="post-title">{post.title}</h3>
      <p className="post-excerpt">{post.excerpt}</p>
      <div className="post-foot">
        <span>{post.author}</span>
        <span className="post-foot-r">{post.footCtaLabel}</span>
      </div>
    </article>
  )
}

export default function InsightsPage() {
  const feature = POSTS.find((p) => p.feature)
  const rest = POSTS.filter((p) => !p.feature)

  return (
    <MarketingShell currentPath="/insights">
      <section className="page-hero">
        <p className="kicker">Insights</p>
        <h1 className="reveal">
          Field notes from
          <br />
          <span className="accent">UK end of tenancy.</span>
        </h1>
        <p className="page-hero-sub reveal reveal-d1">
          Market research, scheme benchmarks, and practical playbooks for property managers. Written by the team that builds Renovo, reviewed by the operators who use it.
        </p>
        <div className="tag-filters reveal reveal-d2" data-filter-scope="insights">
          <button type="button" className="tag-chip active" data-tag="all">
            All<span className="c">{countTag('all')}</span>
          </button>
          {(['research', 'scheme', 'ops', 'product'] as InsightTag[]).map((t) => (
            <button key={t} type="button" className="tag-chip" data-tag={t}>
              {TAG_LABELS[t]}
              <span className="c">{countTag(t)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section first">
        <div className="insights-grid">
          {feature && <FeaturePostCard post={feature} />}
          {rest.map((p, i) => (
            <StandardPostCard key={p.title} post={p} delay={i + 1} />
          ))}
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Get insights in your inbox.</h3>
            <p className="cta-lite-sub">
              One research piece, one scheme note, and one product update per month. No drip, no drumbeat, no filler.
            </p>
          </div>
          <div className="cta-lite-btns">
            <a href="mailto:hello@renovoai.co.uk?subject=Insights%20list" className="btn-primary">
              Subscribe →
            </a>
            <Link href="/book-demo" className="btn-outline">
              Or book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
