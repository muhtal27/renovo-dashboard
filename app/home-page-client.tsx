'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════
// DATA (ported verbatim from public/website-v2.html)
// ═══════════════════════════════════════════════════════════════

type Defect = {
  id: number
  title: string
  room: string
  severity: 'high' | 'medium' | 'low'
  liability: 'tenant' | 'shared' | 'landlord'
  cost: number
  confidence: number
  exhibits: number
  precedent: string
}

type CaseVariant = {
  id: string
  property: string
  scheme: string
  schemeCode: string
  deposit: number
  prediction: number
  tenancyMonths: number
  prompts: string[]
  defects: Defect[]
}

const CASE_VARIANTS: CaseVariant[] = [
  {
    id: 'CHK-2026-002',
    property: '42 Leith Walk',
    scheme: 'SafeDeposits Scotland',
    schemeCode: 'SDS',
    deposit: 1100,
    prediction: 94,
    tenancyMonths: 18,
    prompts: [
      'drafting deduction letter for 42 Leith Walk…',
      'comparing check-in vs checkout at Leith Walk…',
      'scoring 4 defects on CHK-2026-002…',
      'assembling bundle for SafeDeposits Scotland…',
    ],
    defects: [
      { id: 1, title: 'Carpet stain, master bedroom', room: 'Master Bedroom', severity: 'high', liability: 'tenant', cost: 185, confidence: 94, exhibits: 3, precedent: 'SDS-2234' },
      { id: 2, title: 'Oven heavily soiled', room: 'Kitchen', severity: 'high', liability: 'tenant', cost: 120, confidence: 91, exhibits: 2, precedent: 'SDS-2401' },
      { id: 3, title: 'Scuff marks, hallway', room: 'Hallway', severity: 'medium', liability: 'shared', cost: 90, confidence: 72, exhibits: 2, precedent: 'SDS-1987' },
      { id: 4, title: 'Missing shelf bracket', room: 'Kitchen', severity: 'low', liability: 'tenant', cost: 25, confidence: 97, exhibits: 1, precedent: 'SDS-2512' },
    ],
  },
  {
    id: 'CHK-2026-005',
    property: '23 Dalry Road',
    scheme: 'SafeDeposits Scotland',
    schemeCode: 'SDS',
    deposit: 1050,
    prediction: 88,
    tenancyMonths: 24,
    prompts: [
      'reviewing 23 Dalry Road checkout…',
      'comparing check-in vs checkout photos…',
      'scoring 4 defects on CHK-2026-005…',
      'applying fair wear model to 2-year tenancy…',
    ],
    defects: [
      { id: 1, title: 'Curtain hook missing, living room', room: 'Living Room', severity: 'low', liability: 'tenant', cost: 18, confidence: 96, exhibits: 1, precedent: 'SDS-2103' },
      { id: 2, title: 'Light scuffing on bedroom skirting', room: 'Bedroom', severity: 'low', liability: 'shared', cost: 35, confidence: 74, exhibits: 2, precedent: 'SDS-1987' },
      { id: 3, title: 'Limescale on bathroom taps', room: 'Bathroom', severity: 'low', liability: 'tenant', cost: 25, confidence: 81, exhibits: 1, precedent: 'SDS-1955' },
      { id: 4, title: 'Oven interior cleaning', room: 'Kitchen', severity: 'medium', liability: 'tenant', cost: 72, confidence: 88, exhibits: 2, precedent: 'SDS-2401' },
    ],
  },
  {
    id: 'CHK-2026-006',
    property: '156 Causewayside',
    scheme: 'mydeposits Scotland',
    schemeCode: 'mDp',
    deposit: 1250,
    prediction: 78,
    tenancyMonths: 32,
    prompts: [
      'assessing smoke damage at 156 Causewayside…',
      'applying depreciation to carpet claim…',
      'flagging weak photo evidence for tenant…',
      'scoring 4 defects on CHK-2026-006…',
    ],
    defects: [
      { id: 1, title: 'Smoke staining, living room ceiling', room: 'Living Room', severity: 'high', liability: 'tenant', cost: 185, confidence: 88, exhibits: 3, precedent: 'mDp-0587' },
      { id: 2, title: 'Oven and extractor soiled', room: 'Kitchen', severity: 'high', liability: 'tenant', cost: 165, confidence: 74, exhibits: 2, precedent: 'mDp-0441' },
      { id: 3, title: 'Carpet staining, bedroom', room: 'Bedroom', severity: 'high', liability: 'tenant', cost: 240, confidence: 79, exhibits: 3, precedent: 'mDp-0698' },
      { id: 4, title: 'Garden severely overgrown', room: 'Garden', severity: 'medium', liability: 'tenant', cost: 120, confidence: 62, exhibits: 2, precedent: 'mDp-0512' },
    ],
  },
]

type UkCity = { name: string; pc: string; x: number; y: number; scheme: 'sds' | 'dps' | 'tds' | 'mdp' }

const UK_CITIES: UkCity[] = [
  { name: 'Inverness', pc: 'IV1', x: 36, y: 8, scheme: 'sds' },
  { name: 'Aberdeen', pc: 'AB1', x: 50, y: 12, scheme: 'sds' },
  { name: 'Glasgow', pc: 'G1', x: 30, y: 22, scheme: 'mdp' },
  { name: 'Edinburgh', pc: 'EH1', x: 42, y: 23, scheme: 'sds' },
  { name: 'Belfast', pc: 'BT1', x: 14, y: 32, scheme: 'tds' },
  { name: 'Newcastle', pc: 'NE1', x: 49, y: 32, scheme: 'dps' },
  { name: 'Leeds', pc: 'LS1', x: 48, y: 42, scheme: 'tds' },
  { name: 'Liverpool', pc: 'L1', x: 38, y: 46, scheme: 'mdp' },
  { name: 'Manchester', pc: 'M1', x: 44, y: 45, scheme: 'dps' },
  { name: 'Hull', pc: 'HU1', x: 58, y: 42, scheme: 'tds' },
  { name: 'Nottingham', pc: 'NG1', x: 52, y: 51, scheme: 'dps' },
  { name: 'Birmingham', pc: 'B1', x: 47, y: 57, scheme: 'tds' },
  { name: 'Norwich', pc: 'NR1', x: 68, y: 55, scheme: 'mdp' },
  { name: 'Cambridge', pc: 'CB1', x: 61, y: 61, scheme: 'dps' },
  { name: 'Swansea', pc: 'SA1', x: 30, y: 68, scheme: 'mdp' },
  { name: 'Cardiff', pc: 'CF1', x: 38, y: 68, scheme: 'tds' },
  { name: 'Bristol', pc: 'BS1', x: 44, y: 67, scheme: 'dps' },
  { name: 'London', pc: 'E1', x: 62, y: 68, scheme: 'tds' },
  { name: 'Brighton', pc: 'BN1', x: 59, y: 76, scheme: 'dps' },
  { name: 'Southampton', pc: 'SO1', x: 52, y: 76, scheme: 'tds' },
  { name: 'Exeter', pc: 'EX1', x: 38, y: 81, scheme: 'mdp' },
  { name: 'Plymouth', pc: 'PL1', x: 32, y: 86, scheme: 'dps' },
]

const UK_CONNECTIONS: ReadonlyArray<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 5], [5, 6], [2, 7], [7, 8], [8, 6], [6, 9],
  [8, 10], [10, 11], [9, 12], [11, 13], [12, 13], [11, 14], [14, 15], [15, 16],
  [16, 17], [17, 18], [17, 19], [16, 19], [15, 20], [19, 20], [20, 21], [14, 20], [4, 2],
]

type Decision = {
  amt: number
  title: string
  pc: string
  scheme: string
  mo: number
  cite: string
  out: 'awarded' | 'part' | 'denied'
}

const DECISIONS: Decision[] = [
  { amt: 185, title: 'Kitchen deep clean · oven grease', pc: 'EH6', scheme: 'SDS', mo: 18, cite: 'SDS-2234', out: 'awarded' },
  { amt: 270, title: 'Carpet replacement · master bedroom', pc: 'M14', scheme: 'DPS', mo: 32, cite: 'DPS-1876', out: 'awarded' },
  { amt: 120, title: 'Oven and extractor · deep clean', pc: 'G12', scheme: 'mDp', mo: 14, cite: 'mDp-0441', out: 'awarded' },
  { amt: 90, title: 'Hallway scuffs · shared liability', pc: 'E1', scheme: 'TDS', mo: 24, cite: 'TDS-3015', out: 'part' },
  { amt: 0, title: 'Fair wear on carpet · ruled against landlord', pc: 'BS8', scheme: 'TDS', mo: 48, cite: 'TDS-2914', out: 'denied' },
  { amt: 75, title: 'Garden restoration · partial award', pc: 'NE1', scheme: 'DPS', mo: 22, cite: 'DPS-2103', out: 'part' },
  { amt: 35, title: 'Limescale · bathroom taps', pc: 'CF10', scheme: 'DPS', mo: 12, cite: 'DPS-1955', out: 'awarded' },
  { amt: 165, title: 'Smoke staining · living room ceiling', pc: 'LS2', scheme: 'mDp', mo: 26, cite: 'mDp-0587', out: 'awarded' },
  { amt: 240, title: 'Carpet staining · double bedroom', pc: 'B15', scheme: 'TDS', mo: 30, cite: 'TDS-2801', out: 'awarded' },
  { amt: 0, title: 'Minor scuffs · fair wear ruled', pc: 'BN1', scheme: 'TDS', mo: 36, cite: 'TDS-2745', out: 'denied' },
  { amt: 25, title: 'Missing shelf bracket · kitchen', pc: 'EH8', scheme: 'SDS', mo: 12, cite: 'SDS-2512', out: 'awarded' },
  { amt: 95, title: 'Paint touch-up · hallway', pc: 'SE1', scheme: 'DPS', mo: 20, cite: 'DPS-2244', out: 'part' },
  { amt: 180, title: 'Appliance damage · washing machine', pc: 'BT9', scheme: 'TDS', mo: 16, cite: 'TDS-3102', out: 'awarded' },
  { amt: 72, title: 'Wall scuffs · bedroom shared wall', pc: 'NG1', scheme: 'DPS', mo: 18, cite: 'DPS-2198', out: 'part' },
  { amt: 115, title: 'Sink chip repair · kitchen', pc: 'L1', scheme: 'mDp', mo: 14, cite: 'mDp-0669', out: 'awarded' },
  { amt: 210, title: 'Missing furniture · inventory mismatch', pc: 'IV2', scheme: 'SDS', mo: 22, cite: 'SDS-2671', out: 'awarded' },
  { amt: 58, title: 'Blind replacement · living room', pc: 'CV1', scheme: 'DPS', mo: 12, cite: 'DPS-2312', out: 'awarded' },
  { amt: 0, title: 'Betterment challenge · paint ruled new', pc: 'EH3', scheme: 'SDS', mo: 60, cite: 'SDS-2198', out: 'denied' },
]

const WORKFLOW_STEPS = [
  { n: '01', k: 'Intake', h: 'Case opened automatically', p: 'Checkout report, schedule of condition, move out photos, and supporting documents pulled into a single case file.' },
  { n: '02', k: 'Analyse', h: 'Check in vs checkout', p: 'Room by room comparison flags condition changes against the schedule. Missing evidence is flagged before drafting.' },
  { n: '03', k: 'Draft', h: 'Liability with reasoning', p: 'Fair wear and tear, betterment, tenancy length, evidence references. Every defect gets a position, cost, and confidence score.' },
  { n: '04', k: 'Review', h: 'Your team decides', p: 'Manager reads the draft, adjusts positions, adds notes, approves or rejects. Every edit logged with name and timestamp.' },
  { n: '05', k: 'Resolve', h: 'Deposit released', p: 'Agreed positions close the case via TDS, DPS, mydeposits, or SafeDeposits Scotland with a full decision trail.' },
  { n: '06', k: 'Dispute', h: 'Adjudication ready', p: 'If disputed, the bundle is already assembled. Timeline, liability assessment, photos, references.' },
]

const STEP_TABS = ['Intake', 'Analysis', 'Draft', 'Review', 'Resolve', 'Dispute', 'Closed']

const RAIL_DEFECTS = [
  'Kitchen deep clean', 'Carpet stain · bedroom', 'Oven interior clean', 'Hallway scuffs',
  'Garden overgrown', 'Limescale · bathroom', 'Missing shelf bracket', 'Paint touch-up',
  'Smoke staining', 'Appliance damage', 'Wall marks · bedroom', 'Blind replacement',
  'Sink chip repair', 'Light fitting missing', 'Mattress stain',
]

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const fmt = (n: number) => '£' + n.toLocaleString('en-GB')
const sevClass = (s: string) => 'sev-' + s
const confClass = (c: number) => (c > 80 ? 'conf-high' : c > 60 ? 'conf-med' : 'conf-low')
const wearFactor = (months: number) => (months > 36 ? '0.5' : months > 24 ? '0.6' : months > 12 ? '0.8' : '1.0')

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function HomePageClient() {
  const [variant, setVariant] = useState<CaseVariant>(CASE_VARIANTS[0])

  useEffect(() => {
    const pick = CASE_VARIANTS[Math.floor(Math.random() * CASE_VARIANTS.length)]
    setVariant(pick)
  }, [])

  useAmbientParallax()

  return (
    <div>
      <HeroSection variant={variant} />
      <TrustStrip />
      <WhyAgenciesSwitch />
      <HowItWorksHome variant={variant} />
      <SocialProof />
      <InteractiveDemo variant={variant} />
      <LiveBand />
      <DecisionFeed />
      <HomeCta />
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────
function HeroSection({ variant }: { variant: CaseVariant }) {
  const [visible, setVisible] = useState<number[]>([])
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(variant.defects.map((d) => d.id))
      return
    }
    let cancelled = false
    let v: number[] = []
    setVisible([])
    const tick = () => {
      if (cancelled) return
      if (v.length >= variant.defects.length) {
        window.setTimeout(() => {
          if (cancelled) return
          v = []
          setVisible([])
          window.setTimeout(tick, 400)
        }, 3500)
        return
      }
      v = [...v, variant.defects[v.length].id]
      setVisible(v)
      window.setTimeout(tick, 850)
    }
    const initial = window.setTimeout(tick, 400)
    return () => {
      cancelled = true
      window.clearTimeout(initial)
    }
  }, [variant])

  const total = variant.defects
    .filter((d) => visible.includes(d.id))
    .reduce((s, d) => s + d.cost, 0)
  const latestId = visible[visible.length - 1] ?? null
  const showChainId = hoveredId ?? latestId

  const barPct = Math.min(100, Math.round((total / variant.deposit) * 100))

  return (
    <section className="hero">
      <div className="hero-grid">
        <div>
          <div className="hero-kicker">
            <span className="hero-pulse" />
            End of tenancy · Built for UK letting agencies
          </div>
          <h1>
            Close every tenancy in days, <span className="accent">not weeks.</span>
          </h1>
          <p className="hero-sub">
            Renovo pulls checkout evidence straight from your inventory app, drafts a defensible deposit decision with reasoning, and routes it to your property manager to sign off. Eight days from checkout to released deposit. 91% scheme award rate.
          </p>
          <div className="hero-ctas">
            <Link href="/book-demo" className="btn-primary btn-lg">
              Book a demo <span>→</span>
            </Link>
            <Link href="/how-it-works" className="btn-outline">
              See how it works
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val tabnum">
                8.4<span>d</span>
              </span>
              <span className="hero-stat-lbl">
                Avg resolution<em>vs 25.6 days industry</em>
              </span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val tabnum">
                &lt;2<span>m</span>
              </span>
              <span className="hero-stat-lbl">
                Deduction letter<em>down from 45 min</em>
              </span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val tabnum">
                91<span>%</span>
              </span>
              <span className="hero-stat-lbl">
                Scheme award rate<em>rolling 30 days</em>
              </span>
            </div>
          </div>
        </div>

        <div className="hero-panel-wrap">
          <div className="hero-panel-glow" />
          <div className="hero-panel">
            <div className="panel-chrome">
              <div className="panel-chrome-left">
                <div className="panel-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="panel-case">
                  {variant.id} · {variant.property}
                </div>
              </div>
              <div className="panel-live">
                <span className="panel-live-dot" />
                LIVE
              </div>
            </div>
            <div className="panel-claim">
              <div className="claim-header">
                Proposed claim
                <span className="claim-header-right">of {fmt(variant.deposit)} deposit</span>
              </div>
              <div className="claim-value">
                <span className="amt tabnum">{fmt(total)}</span>
                <span className="claim-count">
                  {visible.length} / {variant.defects.length} defects
                </span>
              </div>
              <div className="claim-bar">
                <div className="claim-bar-fill" style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="panel-defects" onMouseLeave={() => setHoveredId(null)}>
              {variant.defects.map((d) => {
                const isVisible = visible.includes(d.id)
                const showChain = showChainId === d.id && isVisible
                const reasons = [
                  { t: `${d.exhibits} photo exhibits`, src: true },
                  { t: `${variant.tenancyMonths}mo tenancy`, src: false },
                  { t: `fair wear ×${wearFactor(variant.tenancyMonths)}`, src: false },
                  { t: d.precedent, src: false },
                ]
                return (
                  <div
                    key={d.id}
                    className={`defect${isVisible ? ' show' : ''}${showChain ? ' show-chain' : ''}`}
                    onMouseEnter={() => {
                      if (isVisible) setHoveredId(d.id)
                    }}
                  >
                    <div className={`defect-bar ${sevClass(d.severity)}`} />
                    <div className="defect-main">
                      <div className="defect-top">
                        <span className="defect-title">{d.title}</span>
                        <span className={`liab-badge liab-${d.liability}`}>{d.liability}</span>
                      </div>
                      <div className="defect-meta">
                        <span>{d.room}</span>
                        <span>·</span>
                        <span className={confClass(d.confidence)}>{d.confidence}% conf.</span>
                        <span className="defect-why">hover · why</span>
                      </div>
                    </div>
                    <div className="defect-cost mono tabnum">{fmt(d.cost)}</div>
                    <div className="reason-chain">
                      {reasons.map((r, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className={`reason-node${r.src ? ' src' : ''}`}>{r.t}</span>
                          {i < reasons.length - 1 && <span className="reason-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="panel-foot">
              <span className="panel-foot-l">Adjudicator prediction · {variant.scheme}</span>
              <span className="panel-foot-r">~{variant.prediction}% award likely</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust Strip ─────────────────────────────────────────────
function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="trust-inner">
        <span className="trust-label">Connects to</span>
        <div className="trust-logos">
          <span className="trust-logo">Reapit</span>
          <span className="trust-logo">Jupix</span>
          <span className="trust-logo">Alto</span>
          <span className="trust-logo">MRI Qube</span>
          <span className="trust-logo">InventoryBase</span>
          <span className="trust-logo">Inventory Hive</span>
          <span className="trust-sep">|</span>
          <span className="trust-logo">SDS</span>
          <span className="trust-logo">DPS</span>
          <span className="trust-logo">TDS</span>
          <span className="trust-logo">mydeposits</span>
        </div>
      </div>
    </section>
  )
}

// ─── Why Agencies Switch ─────────────────────────────────────
function WhyAgenciesSwitch() {
  return (
    <section className="section">
      <p className="kicker">Why agencies switch</p>
      <h2>Checkout becomes a defensible decision, not a weekend of admin.</h2>
      <p className="section-sub">
        Property managers stitch every checkout across inventory apps, shared drives, email, Word docs, and scheme portals. Renovo replaces the stitch with one workspace — and a decision trail the scheme will uphold.
      </p>
      <div className="outcome-grid">
        <div className="outcome-card">
          <div className="outcome-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="outcome-stat tabnum">
            92<span>%</span>
          </div>
          <div className="outcome-lbl">Less admin per case.</div>
          <p className="outcome-desc">
            From two to three hours of retyping evidence to fifteen minutes of manager review. Property managers spend their time on tenancies, not document wrangling.
          </p>
        </div>
        <div className="outcome-card">
          <div className="outcome-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="outcome-stat tabnum">
            91<span>%</span>
          </div>
          <div className="outcome-lbl">Scheme award rate.</div>
          <p className="outcome-desc">
            Every liability call cites photo exhibits, fair wear factor, and scheme precedent. Adjudication bundles assemble themselves: timeline, evidence, reasoning, all attached.
          </p>
        </div>
        <div className="outcome-card">
          <div className="outcome-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="outcome-stat tabnum">
            8<span>/8</span>
          </div>
          <div className="outcome-lbl">UK schemes, one workflow.</div>
          <p className="outcome-desc">
            Direct connectors to SafeDeposits Scotland, DPS, TDS and mydeposits. Submit adjudication bundles without copying and pasting into four different portals.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works (home) with sticky workspace ───────────────
function HowItWorksHome({ variant }: { variant: CaseVariant }) {
  const [activeStep, setActiveStep] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const pick = () => {
      const list = listRef.current
      if (!list) return
      const cards = Array.from(list.querySelectorAll('.step-card')) as HTMLElement[]
      const centerY = window.innerHeight * 0.45
      let bestIdx = 0
      let bestDist = Infinity
      cards.forEach((el, idx) => {
        const r = el.getBoundingClientRect()
        const midY = r.top + r.height / 2
        const dist = Math.abs(midY - centerY)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = idx
        }
      })
      setActiveStep(bestIdx)
    }
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    pick()
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [])

  return (
    <section className="section-wide">
      <div className="workflow-grid">
        <div>
          <p className="kicker">How it works</p>
          <h2>
            Checkout to deposit release,
            <br />
            in one system.
          </h2>
          <p className="section-sub">
            AI drafts the repeatable bits. Managers approve where judgement matters. Scheme ready at every step.
          </p>
          <div className="step-list" ref={listRef}>
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={s.n} className={`step-card${i === activeStep ? ' active' : ''}`}>
                <div className="step-row">
                  <div className="step-num">{s.n}</div>
                  <div>
                    <div className="step-tag">{s.k}</div>
                    <div className="step-head">{s.h}</div>
                    <div className="step-desc">{s.p}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="workspace-col">
          <div className="workspace-sticky">
            <div className="wsm">
              <WorkspaceMock activeStep={activeStep} variant={variant} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkspaceMock({ activeStep, variant }: { activeStep: number; variant: CaseVariant }) {
  return (
    <>
      <div className="wsm-chrome">
        <div className="panel-chrome-left">
          <div className="panel-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="panel-case">
            {variant.id} · {variant.property}
          </div>
        </div>
        <div className="panel-live">
          <span className="panel-live-dot" />
          {WORKFLOW_STEPS[activeStep].k.toUpperCase()}
        </div>
      </div>
      <div className="wsm-tabs">
        {STEP_TABS.map((s, i) => (
          <div
            key={s}
            className={`wsm-tab ${i < activeStep ? 'done' : i === activeStep ? 'active' : ''}`}
          >
            {s.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="wsm-body">
        <WorkspaceStepContent activeStep={activeStep} variant={variant} />
      </div>
    </>
  )
}

function WorkspaceStepContent({ activeStep, variant }: { activeStep: number; variant: CaseVariant }) {
  if (activeStep === 0) return <StepIngest />
  if (activeStep === 1) return <StepAnalyse />
  if (activeStep === 2) return <StepDraft variant={variant} />
  if (activeStep === 3) return <StepReview variant={variant} />
  if (activeStep === 4) return <StepResolve variant={variant} />
  if (activeStep === 5) return <StepDispute variant={variant} />
  return null
}

function StepIngest() {
  const docs = [
    { label: 'Check in inventory', meta: 'InventoryBase · 14 pages' },
    { label: 'Checkout inventory', meta: 'Uploaded · 18 pages' },
    { label: 'Tenancy agreement', meta: 'Reapit sync · 9 pages' },
    { label: 'Move out photos', meta: '12 images · EXIF verified' },
  ]
  return (
    <>
      <div className="wsm-label">Documents ingested</div>
      {docs.map((d) => (
        <div key={d.label} className="wsm-doc">
          <div className="wsm-doc-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="wsm-doc-main">
            <div className="wsm-doc-title">{d.label}</div>
            <div className="wsm-doc-meta">{d.meta}</div>
          </div>
          <div className="wsm-doc-tag">Linked</div>
        </div>
      ))}
    </>
  )
}

function StepAnalyse() {
  const rooms: Array<{ name: string; before: string; after: 'Good' | 'Fair' | 'Poor' | 'Excellent' }> = [
    { name: 'Living Room', before: 'Good', after: 'Fair' },
    { name: 'Kitchen', before: 'Good', after: 'Poor' },
    { name: 'Master Bedroom', before: 'Excellent', after: 'Fair' },
    { name: 'Bathroom', before: 'Good', after: 'Good' },
    { name: 'Hallway', before: 'Good', after: 'Fair' },
  ]
  const condCls = (c: string) => (c === 'Poor' ? 'wsm-cond-poor' : c === 'Fair' ? 'wsm-cond-fair' : 'wsm-cond-good')
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="wsm-label" style={{ marginBottom: 0 }}>Room conditions</div>
        <div className="wsm-analysing">Analysing</div>
      </div>
      {rooms.map((r) => (
        <div key={r.name} className="wsm-room">
          <div className="wsm-room-name">{r.name}</div>
          <span className="wsm-cond wsm-cond-good">{r.before}</span>
          <svg className="wsm-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span className={`wsm-cond ${condCls(r.after)}`}>{r.after}</span>
        </div>
      ))}
    </>
  )
}

function StepDraft({ variant }: { variant: CaseVariant }) {
  const total = variant.defects.reduce((s, d) => s + d.cost, 0)
  return (
    <>
      <div className="wsm-label">AI draft · {variant.defects.length} defects</div>
      {variant.defects.map((d) => (
        <div key={d.id} className="wsm-defect">
          <div className={`wsm-defect-sev ${sevClass(d.severity)}`} />
          <div className="wsm-defect-title">{d.title}</div>
          <span className={`liab-badge liab-${d.liability}`}>{d.liability}</span>
          <span className={`wsm-defect-conf ${confClass(d.confidence)}`}>{d.confidence}%</span>
          <span className="wsm-defect-cost">{fmt(d.cost)}</span>
        </div>
      ))}
      <div className="wsm-summary" style={{ marginTop: 12, background: 'rgba(16,185,129,0.05)' }}>
        <span style={{ color: 'rgba(255,255,255,.5)' }}>Total proposed</span>
        <span className="mono" style={{ color: 'var(--em-300)', fontWeight: 600 }}>{fmt(total)}</span>
      </div>
    </>
  )
}

function StepReview({ variant }: { variant: CaseVariant }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="wsm-label" style={{ marginBottom: 0 }}>Manager review</div>
        <span className="wsm-ready">All reviewed</span>
      </div>
      {variant.defects.map((d) => (
        <div key={d.id} className="wsm-defect reviewed">
          <div className="wsm-check">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="wsm-defect-title">{d.title}</div>
          <span className="wsm-defect-cost">{fmt(d.cost)}</span>
        </div>
      ))}
      <div className="wsm-audit">
        <div className="wsm-label" style={{ marginBottom: 4 }}>Audit trail</div>
        <div className="wsm-audit-entry">10:42 · JM · liability tenant → shared (D3)</div>
        <div className="wsm-audit-entry">10:43 · JM · cost £90 → £75 (D3)</div>
        <div className="wsm-audit-entry">10:45 · JM · approved all</div>
      </div>
    </>
  )
}

function StepResolve({ variant }: { variant: CaseVariant }) {
  const total = variant.defects.reduce((s, d) => s + d.cost, 0)
  const toTenant = variant.deposit - total
  const pct = Math.round((total / variant.deposit) * 100)
  const circ = 2 * Math.PI * 38
  const dash = (pct / 100) * circ
  return (
    <>
      <div className="wsm-label">Deposit released</div>
      <div className="wsm-donut">
        <div className="wsm-donut-svg">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(14,165,233,0.4)" strokeWidth="14" />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#10b981"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
          <div className="wsm-donut-label mono">{pct}%</div>
        </div>
        <div className="wsm-donut-stats">
          <div className="wsm-split-row wsm-split-em">
            <div>
              <div className="wsm-split-kicker">To landlord</div>
              <div className="wsm-split-val mono tabnum">{fmt(total)}</div>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--em-500)' }} />
          </div>
          <div className="wsm-split-row wsm-split-sky">
            <div>
              <div className="wsm-split-kicker">To tenant</div>
              <div className="wsm-split-val mono tabnum">{fmt(toTenant)}</div>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sky-500)' }} />
          </div>
        </div>
      </div>
      <div className="wsm-summary">
        <span style={{ color: 'rgba(255,255,255,.5)' }}>Released via {variant.scheme}</span>
        <span className="mono" style={{ color: 'var(--em-400)', fontSize: 10 }}>✓ Complete</span>
      </div>
    </>
  )
}

function StepDispute({ variant }: { variant: CaseVariant }) {
  const exhibits = [
    'Exhibit A. Signed check in inventory',
    'Exhibit B. Signed checkout inventory',
    'Exhibit C. Move out photographs (12)',
    'Exhibit D. Tenancy agreement',
    'Exhibit E. Contractor quotes (2)',
    'Exhibit F. Tenant correspondence',
  ]
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="wsm-label" style={{ marginBottom: 0 }}>Adjudication bundle</div>
        <span className="wsm-ready">Ready</span>
      </div>
      {exhibits.map((e) => (
        <div key={e} className="wsm-exhibit">
          <svg className="wsm-exhibit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <span className="wsm-exhibit-name">{e}</span>
          <span className="wsm-exhibit-check">✓</span>
        </div>
      ))}
      <div className="wsm-predict">
        <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Predicted award</span>
        <span className="mono" style={{ color: 'var(--em-300)', fontWeight: 600 }}>~{variant.prediction}%</span>
      </div>
    </>
  )
}

// ─── Social Proof ────────────────────────────────────────────
function SocialProof() {
  return (
    <section className="section">
      <p className="kicker">What operators tell us</p>
      <h2>Feedback from property managers, not sales teams.</h2>
      <p className="section-sub">
        Our customers run live residential letting portfolios across the UK. Full names and agency logos available on request — most compliance teams prefer we keep them off the public site.
      </p>
      <div className="proof-grid">
        <div className="proof-card">
          <p className="proof-quote">
            What used to be two hours of checkout paperwork is now fifteen minutes of review. Across 1,200 tenancies, that is the single biggest operational lever we have pulled this year.
          </p>
          <div className="proof-author">
            <div className="proof-avatar">JM</div>
            <div className="proof-who">
              <div className="proof-name">Head of Lettings</div>
              <div className="proof-role">Edinburgh agency · 1,200 tenancies</div>
            </div>
          </div>
        </div>
        <div className="proof-card">
          <p className="proof-quote">
            When a dispute reaches adjudication, everything we need is already there — photos, reasoning, scheme precedent. We stopped losing cases on incomplete evidence packs three months in.
          </p>
          <div className="proof-author">
            <div className="proof-avatar">SK</div>
            <div className="proof-who">
              <div className="proof-name">Branch Director</div>
              <div className="proof-role">Glasgow &amp; Paisley · 480 tenancies</div>
            </div>
          </div>
        </div>
        <div className="proof-card">
          <p className="proof-quote">
            Reapit connected in an afternoon. The first checkout came back the next morning with a drafted deduction letter that needed two line edits. That is when the team knew.
          </p>
          <div className="proof-author">
            <div className="proof-avatar">RA</div>
            <div className="proof-who">
              <div className="proof-name">Property Manager</div>
              <div className="proof-role">Central London · 340 tenancies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Interactive Demo ────────────────────────────────────────
function InteractiveDemo({ variant }: { variant: CaseVariant }) {
  const [assign, setAssign] = useState<Record<number, 'tenant' | 'shared' | 'landlord'>>({})

  useEffect(() => {
    const initial: Record<number, 'tenant' | 'shared' | 'landlord'> = {}
    variant.defects.forEach((d) => {
      initial[d.id] = d.liability
    })
    setAssign(initial)
  }, [variant])

  const tenantSum = variant.defects
    .filter((d) => assign[d.id] === 'tenant')
    .reduce((s, d) => s + d.cost, 0)
  const sharedSum = variant.defects
    .filter((d) => assign[d.id] === 'shared')
    .reduce((s, d) => s + Math.round(d.cost / 2), 0)
  const claim = tenantSum + sharedSum
  const pct = Math.min(100, Math.round((claim / variant.deposit) * 100))
  const toTenant = Math.max(0, variant.deposit - claim)

  return (
    <section className="section">
      <p className="kicker">Try it yourself</p>
      <h2>
        Reassign a defect.
        <br />
        Watch the claim change.
      </h2>
      <p className="section-sub">
        Realistic scenarios, fictional tenancies. The logic, reasoning model, and claim mechanics are identical to what a property manager sees in the live workspace.
      </p>
      <div className="inter-card">
        <div className="inter-grid">
          <div className="inter-list">
            {variant.defects.map((d) => (
              <div key={d.id} className="inter-row">
                <div className="inter-row-inner">
                  <div className="inter-row-main">
                    <div className="inter-row-title">{d.title}</div>
                    <div className="inter-row-meta">
                      {d.room} · <span className="mono">{fmt(d.cost)}</span>
                    </div>
                  </div>
                  <div className="inter-btns">
                    {(['tenant', 'shared', 'landlord'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`liab-btn ${assign[d.id] === k ? `sel-${k}` : ''}`}
                        title={k[0].toUpperCase() + k.slice(1)}
                        onClick={() => setAssign((prev) => ({ ...prev, [d.id]: k }))}
                      >
                        <span className="short">{k[0]}</span>
                        <span className="full">{k}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="inter-sep" />
          <div className="inter-totals">
            <div className="inter-label">Claim total</div>
            <div className="inter-amt tabnum mono">{fmt(claim)}</div>
            <div className="inter-sub">of {fmt(variant.deposit)} deposit</div>
            <div className="inter-bar">
              <div className="inter-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="inter-stat-row">
              <span className="label">Returns to tenant</span>
              <span className="val val-em mono tabnum">{fmt(toTenant)}</span>
            </div>
            <div className="inter-stat-row">
              <span className="label">% of deposit claimed</span>
              <span className="val val-n mono tabnum">{pct}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Live Band (UK map + rail) ───────────────────────────────
function LiveBand() {
  const [activeCount, setActiveCount] = useState(412)
  const [pulses, setPulses] = useState<Record<number, number>>({})
  const [rail, setRail] = useState<Array<{ id: number; city: UkCity; defect: string; amt: number }>>([])
  const railId = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const counterId = window.setInterval(() => {
      setActiveCount((v) => {
        const next = v + Math.floor(Math.random() * 5) - 2
        if (next < 380) return 380
        if (next > 460) return 460
        return next
      })
    }, 2200)

    let cancelled = false
    const scheduleNext = () => {
      if (cancelled) return
      window.setTimeout(
        () => {
          if (cancelled) return
          const idx = Math.floor(Math.random() * UK_CITIES.length)
          const city = UK_CITIES[idx]
          const pulseAt = Date.now()
          setPulses((p) => ({ ...p, [idx]: pulseAt }))
          window.setTimeout(() => {
            setPulses((p) => {
              if (p[idx] !== pulseAt) return p
              const next = { ...p }
              delete next[idx]
              return next
            })
          }, 2400)
          const defect = RAIL_DEFECTS[Math.floor(Math.random() * RAIL_DEFECTS.length)]
          const amt = 25 + Math.floor(Math.random() * 270)
          railId.current += 1
          const id = railId.current
          setRail((prev) => {
            const next = [{ id, city, defect, amt }, ...prev]
            return next.slice(0, 8)
          })
          scheduleNext()
        },
        900 + Math.random() * 1400,
      )
    }
    const start = window.setTimeout(scheduleNext, 600)

    return () => {
      cancelled = true
      window.clearInterval(counterId)
      window.clearTimeout(start)
    }
  }, [])

  return (
    <section className="live-band">
      <div className="live-band-head">
        <div>
          <p className="kicker">Live across the UK</p>
          <h2>Scheme activity, in real time.</h2>
        </div>
        <p className="live-band-sub">
          Cases resolving across Scotland, England &amp; Wales, and Northern Ireland right now. Every pulse is a draft, a review, or a deposit released through Renovo.
        </p>
      </div>
      <div className="uk-live-counters" style={{ marginBottom: 24 }}>
        <div className="uk-count">
          <div className="uk-count-k">Active cases</div>
          <div className="uk-count-v tabnum">{activeCount}</div>
          <div className="uk-count-d">across 47 agencies</div>
        </div>
        <div className="uk-count">
          <div className="uk-count-k">Award rate</div>
          <div className="uk-count-v tabnum">
            91<span style={{ opacity: 0.6 }}>%</span>
          </div>
          <div className="uk-count-d">rolling 30 days</div>
        </div>
        <div className="uk-count">
          <div className="uk-count-k">Avg resolution</div>
          <div className="uk-count-v tabnum">
            8.4<span style={{ opacity: 0.5, fontSize: '0.7em' }}> d</span>
          </div>
          <div className="uk-count-d">vs 25.6 industry</div>
        </div>
      </div>
      <div className="uk-stage">
        <div className="uk-map-wrap">
          <div className="uk-map-grid-bg" />
          <svg className="uk-map-net" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
            {UK_CONNECTIONS.map(([a, b], i) => {
              const c1 = UK_CITIES[a]
              const c2 = UK_CITIES[b]
              return <line key={i} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} />
            })}
          </svg>
          {UK_CITIES.map((c, i) => (
            <div
              key={c.name}
              className={`uk-dot ${c.scheme}${pulses[i] ? ' pulse' : ''}`}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <div className="uk-dot-core" />
              <div className="uk-dot-ring" />
              <span className="uk-dot-label">
                {c.name} · {c.pc} · {c.scheme.toUpperCase()}
              </span>
            </div>
          ))}
          <div className="uk-legend">
            <div className="uk-legend-item sds">
              <span className="uk-legend-dot" />
              <span className="uk-legend-name">SafeDeposits Scotland</span>
            </div>
            <div className="uk-legend-item mdp">
              <span className="uk-legend-dot" />
              <span className="uk-legend-name">mydeposits</span>
            </div>
            <div className="uk-legend-item dps">
              <span className="uk-legend-dot" />
              <span className="uk-legend-name">DPS</span>
            </div>
            <div className="uk-legend-item tds">
              <span className="uk-legend-dot" />
              <span className="uk-legend-name">TDS</span>
            </div>
          </div>
        </div>
        <div className="uk-rail">
          <div className="uk-rail-head">
            <span className="uk-rail-head-k">Resolving now</span>
            <span className="uk-rail-live">LIVE</span>
          </div>
          {rail.map((row) => (
            <div key={row.id} className="uk-rail-row uk-rail-new">
              <span className={`uk-rail-scheme ${row.city.scheme}`}>
                {row.city.scheme.toUpperCase()}
              </span>
              <span className="uk-rail-pc">{row.city.pc}</span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'rgba(255,255,255,.75)',
                  fontSize: 11,
                }}
              >
                {row.defect}
              </span>
              <span className="uk-rail-amt">{fmt(row.amt)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Decision Feed (ticker) ──────────────────────────────────
function DecisionFeed() {
  const [count, setCount] = useState(17342)
  const items = useMemo(() => [...DECISIONS, ...DECISIONS, ...DECISIONS], [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="feed-wrap">
      <div className="feed-head">
        <span className="feed-head-l">Live decision feed · UK schemes</span>
        <span className="feed-head-r">
          <b>{count.toLocaleString('en-GB')}</b> resolved · last 7 days
        </span>
      </div>
      <div className="feed-track">
        {items.map((d, i) => (
          <div key={i} className="feed-card">
            <div className={`feed-amt ${d.out}`}>{d.amt === 0 ? '£0' : fmt(d.amt)}</div>
            <div className="feed-body">
              <div className="feed-title">{d.title}</div>
              <div className="feed-meta">
                <span>{d.pc}</span>
                <span className="dot">·</span>
                <span>{d.mo}mo</span>
                <span className="dot">·</span>
                <span>{d.scheme}</span>
                <span className="dot">·</span>
                <span>{d.cite}</span>
              </div>
            </div>
            <span className={`feed-pill ${d.out}`}>{d.out}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Home CTA ────────────────────────────────────────────────
function HomeCta() {
  return (
    <section className="cta">
      <div className="cta-card">
        <h2>
          Every deposit decision,
          <br />
          <span className="accent">defensible the moment it is made.</span>
        </h2>
        <p className="cta-sub">
          Enterprise software for end of tenancy, built for UK letting agencies. Scheme native. Audit first. UK GDPR, ICO ZC112030, data hosted in London.
        </p>
        <div className="cta-btns">
          <Link href="/book-demo" className="btn-primary btn-lg">
            Book a demo →
          </Link>
          <Link href="/pricing" className="btn-outline">
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Ambient parallax hook ───────────────────────────────────
function useAmbientParallax() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const glows = Array.from(document.querySelectorAll('.marketing-page .ambient .glow')) as HTMLElement[]
    if (!glows.length) return
    let tx = 0
    let ty = 0
    let rafId: number | null = null
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        glows.forEach((g, i) => {
          const factor = (i + 1) * 14
          g.style.transform = `translate3d(${tx * factor}px, ${ty * factor}px, 0)`
        })
        rafId = null
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      glows.forEach((g) => {
        g.style.transform = ''
      })
    }
  }, [])
}
