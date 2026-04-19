"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { DASHBOARD_SIGN_IN_EXTERNAL, DASHBOARD_SIGN_IN_URL } from "@/lib/marketing-links"

function BrandMark({ withText = true, size = 28 }: { withText?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span
          className="absolute rounded-[10px]"
          style={{
            inset: -4,
            background: "radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)",
            zIndex: -1,
          }}
        />
        <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full">
          <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" opacity="0.55" />
          <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" opacity="0.8" />
          <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
        </svg>
      </span>
      {withText && (
        <span className="font-semibold tracking-[-0.01em] text-white">Renovo AI</span>
      )}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — ported from public/website-v2.html
   ═══════════════════════════════════════════════════════════════════════════ */

type Liability = "tenant" | "shared" | "landlord"
type Severity = "high" | "medium" | "low"
type Outcome = "awarded" | "part" | "denied"

type Defect = {
  id: number
  title: string
  room: string
  severity: Severity
  liability: Liability
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
    id: "CHK-2026-002",
    property: "42 Leith Walk",
    scheme: "SafeDeposits Scotland",
    schemeCode: "SDS",
    deposit: 1100,
    prediction: 94,
    tenancyMonths: 18,
    prompts: [
      "drafting deduction letter for 42 Leith Walk…",
      "comparing check-in vs checkout at Leith Walk…",
      "scoring 4 defects on CHK-2026-002…",
      "assembling bundle for SafeDeposits Scotland…",
    ],
    defects: [
      { id: 1, title: "Carpet stain, master bedroom", room: "Master Bedroom", severity: "high", liability: "tenant", cost: 185, confidence: 94, exhibits: 3, precedent: "SDS-2234" },
      { id: 2, title: "Oven heavily soiled", room: "Kitchen", severity: "high", liability: "tenant", cost: 120, confidence: 91, exhibits: 2, precedent: "SDS-2401" },
      { id: 3, title: "Scuff marks, hallway", room: "Hallway", severity: "medium", liability: "shared", cost: 90, confidence: 72, exhibits: 2, precedent: "SDS-1987" },
      { id: 4, title: "Missing shelf bracket", room: "Kitchen", severity: "low", liability: "tenant", cost: 25, confidence: 97, exhibits: 1, precedent: "SDS-2512" },
    ],
  },
  {
    id: "CHK-2026-005",
    property: "23 Dalry Road",
    scheme: "SafeDeposits Scotland",
    schemeCode: "SDS",
    deposit: 1050,
    prediction: 88,
    tenancyMonths: 24,
    prompts: [
      "reviewing 23 Dalry Road checkout…",
      "comparing check-in vs checkout photos…",
      "scoring 4 defects on CHK-2026-005…",
      "applying fair wear model to 2-year tenancy…",
    ],
    defects: [
      { id: 1, title: "Curtain hook missing, living room", room: "Living Room", severity: "low", liability: "tenant", cost: 18, confidence: 96, exhibits: 1, precedent: "SDS-2103" },
      { id: 2, title: "Light scuffing on bedroom skirting", room: "Bedroom", severity: "low", liability: "shared", cost: 35, confidence: 74, exhibits: 2, precedent: "SDS-1987" },
      { id: 3, title: "Limescale on bathroom taps", room: "Bathroom", severity: "low", liability: "tenant", cost: 25, confidence: 81, exhibits: 1, precedent: "SDS-1955" },
      { id: 4, title: "Oven interior cleaning", room: "Kitchen", severity: "medium", liability: "tenant", cost: 72, confidence: 88, exhibits: 2, precedent: "SDS-2401" },
    ],
  },
  {
    id: "CHK-2026-006",
    property: "156 Causewayside",
    scheme: "mydeposits Scotland",
    schemeCode: "mDp",
    deposit: 1250,
    prediction: 78,
    tenancyMonths: 32,
    prompts: [
      "assessing smoke damage at 156 Causewayside…",
      "applying depreciation to carpet claim…",
      "flagging weak photo evidence for tenant…",
      "scoring 4 defects on CHK-2026-006…",
    ],
    defects: [
      { id: 1, title: "Smoke staining, living room ceiling", room: "Living Room", severity: "high", liability: "tenant", cost: 185, confidence: 88, exhibits: 3, precedent: "mDp-0587" },
      { id: 2, title: "Oven and extractor soiled", room: "Kitchen", severity: "high", liability: "tenant", cost: 165, confidence: 74, exhibits: 2, precedent: "mDp-0441" },
      { id: 3, title: "Carpet staining, bedroom", room: "Bedroom", severity: "high", liability: "tenant", cost: 240, confidence: 79, exhibits: 3, precedent: "mDp-0698" },
      { id: 4, title: "Garden severely overgrown", room: "Garden", severity: "medium", liability: "tenant", cost: 120, confidence: 62, exhibits: 2, precedent: "mDp-0512" },
    ],
  },
]

const WORKFLOW_STEPS = [
  { n: "01", k: "Intake", h: "Case opened automatically", p: "Checkout report, schedule of condition, move out photos, and supporting documents pulled into a single case file." },
  { n: "02", k: "Analyse", h: "Check in vs checkout", p: "Room by room comparison flags condition changes against the schedule. Missing evidence is flagged before drafting." },
  { n: "03", k: "Draft", h: "Liability with reasoning", p: "Fair wear and tear, betterment, tenancy length, evidence references. Every defect gets a position, cost, and confidence score." },
  { n: "04", k: "Review", h: "Your team decides", p: "Manager reads the draft, adjusts positions, adds notes, approves or rejects. Every edit logged with name and timestamp." },
  { n: "05", k: "Resolve", h: "Deposit released", p: "Agreed positions close the case via TDS, DPS, mydeposits, or SafeDeposits Scotland with a full decision trail." },
  { n: "06", k: "Dispute", h: "Adjudication ready", p: "If disputed, the bundle is already assembled. Timeline, liability assessment, photos, references." },
]

const STEP_TABS = ["Intake", "Analysis", "Draft", "Review", "Resolve", "Dispute", "Closed"]

type UkScheme = "sds" | "mdp" | "dps" | "tds"

const UK_CITIES: { name: string; pc: string; x: number; y: number; scheme: UkScheme }[] = [
  { name: "Inverness", pc: "IV1", x: 36, y: 8, scheme: "sds" },
  { name: "Aberdeen", pc: "AB1", x: 50, y: 12, scheme: "sds" },
  { name: "Glasgow", pc: "G1", x: 30, y: 22, scheme: "mdp" },
  { name: "Edinburgh", pc: "EH1", x: 42, y: 23, scheme: "sds" },
  { name: "Belfast", pc: "BT1", x: 14, y: 32, scheme: "tds" },
  { name: "Newcastle", pc: "NE1", x: 49, y: 32, scheme: "dps" },
  { name: "Leeds", pc: "LS1", x: 48, y: 42, scheme: "tds" },
  { name: "Liverpool", pc: "L1", x: 38, y: 46, scheme: "mdp" },
  { name: "Manchester", pc: "M1", x: 44, y: 45, scheme: "dps" },
  { name: "Hull", pc: "HU1", x: 58, y: 42, scheme: "tds" },
  { name: "Nottingham", pc: "NG1", x: 52, y: 51, scheme: "dps" },
  { name: "Birmingham", pc: "B1", x: 47, y: 57, scheme: "tds" },
  { name: "Norwich", pc: "NR1", x: 68, y: 55, scheme: "mdp" },
  { name: "Cambridge", pc: "CB1", x: 61, y: 61, scheme: "dps" },
  { name: "Swansea", pc: "SA1", x: 30, y: 68, scheme: "mdp" },
  { name: "Cardiff", pc: "CF1", x: 38, y: 68, scheme: "tds" },
  { name: "Bristol", pc: "BS1", x: 44, y: 67, scheme: "dps" },
  { name: "London", pc: "E1", x: 62, y: 68, scheme: "tds" },
  { name: "Brighton", pc: "BN1", x: 59, y: 76, scheme: "dps" },
  { name: "Southampton", pc: "SO1", x: 52, y: 76, scheme: "tds" },
  { name: "Exeter", pc: "EX1", x: 38, y: 81, scheme: "mdp" },
  { name: "Plymouth", pc: "PL1", x: 32, y: 86, scheme: "dps" },
]

const UK_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 5], [5, 6], [2, 7], [7, 8], [8, 6], [6, 9],
  [8, 10], [10, 11], [9, 12], [11, 13], [12, 13], [11, 14], [14, 15], [15, 16],
  [16, 17], [17, 18], [17, 19], [16, 19], [15, 20], [19, 20], [20, 21], [14, 20], [4, 2],
]

const RAIL_DEFECTS = [
  "Kitchen deep clean", "Carpet stain · bedroom", "Oven interior clean", "Hallway scuffs",
  "Garden overgrown", "Limescale · bathroom", "Missing shelf bracket", "Paint touch-up",
  "Smoke staining", "Appliance damage", "Wall marks · bedroom", "Blind replacement",
  "Sink chip repair", "Light fitting missing", "Mattress stain",
]

type Decision = { amt: number; title: string; pc: string; scheme: string; mo: number; cite: string; out: Outcome }

const DECISIONS: Decision[] = [
  { amt: 185, title: "Kitchen deep clean · oven grease", pc: "EH6", scheme: "SDS", mo: 18, cite: "SDS-2234", out: "awarded" },
  { amt: 270, title: "Carpet replacement · master bedroom", pc: "M14", scheme: "DPS", mo: 32, cite: "DPS-1876", out: "awarded" },
  { amt: 120, title: "Oven and extractor · deep clean", pc: "G12", scheme: "mDp", mo: 14, cite: "mDp-0441", out: "awarded" },
  { amt: 90, title: "Hallway scuffs · shared liability", pc: "E1", scheme: "TDS", mo: 24, cite: "TDS-3015", out: "part" },
  { amt: 0, title: "Fair wear on carpet · ruled against landlord", pc: "BS8", scheme: "TDS", mo: 48, cite: "TDS-2914", out: "denied" },
  { amt: 75, title: "Garden restoration · partial award", pc: "NE1", scheme: "DPS", mo: 22, cite: "DPS-2103", out: "part" },
  { amt: 35, title: "Limescale · bathroom taps", pc: "CF10", scheme: "DPS", mo: 12, cite: "DPS-1955", out: "awarded" },
  { amt: 165, title: "Smoke staining · living room ceiling", pc: "LS2", scheme: "mDp", mo: 26, cite: "mDp-0587", out: "awarded" },
  { amt: 240, title: "Carpet staining · double bedroom", pc: "B15", scheme: "TDS", mo: 30, cite: "TDS-2801", out: "awarded" },
  { amt: 0, title: "Minor scuffs · fair wear ruled", pc: "BN1", scheme: "TDS", mo: 36, cite: "TDS-2745", out: "denied" },
  { amt: 25, title: "Missing shelf bracket · kitchen", pc: "EH8", scheme: "SDS", mo: 12, cite: "SDS-2512", out: "awarded" },
  { amt: 95, title: "Paint touch-up · hallway", pc: "SE1", scheme: "DPS", mo: 20, cite: "DPS-2244", out: "part" },
  { amt: 180, title: "Appliance damage · washing machine", pc: "BT9", scheme: "TDS", mo: 16, cite: "TDS-3102", out: "awarded" },
  { amt: 72, title: "Wall scuffs · bedroom shared wall", pc: "NG1", scheme: "DPS", mo: 18, cite: "DPS-2198", out: "part" },
  { amt: 115, title: "Sink chip repair · kitchen", pc: "L1", scheme: "mDp", mo: 14, cite: "mDp-0669", out: "awarded" },
  { amt: 210, title: "Missing furniture · inventory mismatch", pc: "IV2", scheme: "SDS", mo: 22, cite: "SDS-2671", out: "awarded" },
  { amt: 58, title: "Blind replacement · living room", pc: "CV1", scheme: "DPS", mo: 12, cite: "DPS-2312", out: "awarded" },
  { amt: 0, title: "Betterment challenge · paint ruled new", pc: "EH3", scheme: "SDS", mo: 60, cite: "SDS-2198", out: "denied" },
]

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
  { href: "/about", label: "About" },
] as const

const mobileNavLinks = [
  ...navLinks,
  { href: "/contact", label: "Contact" },
  { href: "/investors", label: "Investors" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const

const footerCols = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Demo" },
    { href: "/developers", label: "API Docs" },
    { href: "/changelog", label: "Changelog" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/investors", label: "Investors" },
    { href: "/careers", label: "Careers" },
    { href: "/insights", label: "Insights" },
  ],
  Legal: [
    { href: "/compliance", label: "Compliance" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/complaints", label: "Complaints" },
    { href: "/security", label: "Security" },
  ],
} as const

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`

function wearFactor(months: number): string {
  if (months > 36) return "0.5"
  if (months > 24) return "0.6"
  if (months > 12) return "0.8"
  return "1.0"
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

function SignInLink({ className, children }: { className: string; children: React.ReactNode }) {
  if (DASHBOARD_SIGN_IN_EXTERNAL) {
    return <a href={DASHBOARD_SIGN_IN_URL} className={className}>{children}</a>
  }
  return <Link href={DASHBOARD_SIGN_IN_URL} className={className}>{children}</Link>
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOMEPAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function HomePageClient() {
  const reducedMotion = useReducedMotion()

  // Variant pick (client only to avoid hydration mismatch)
  const [variantIdx, setVariantIdx] = useState(0)
  useEffect(() => {
    setVariantIdx(Math.floor(Math.random() * CASE_VARIANTS.length))
  }, [])
  const variant = CASE_VARIANTS[variantIdx]

  // Hero defect stream
  const [visible, setVisible] = useState<number[]>([])
  useEffect(() => {
    if (reducedMotion) {
      setVisible(variant.defects.map((d) => d.id))
      return
    }
    if (visible.length >= variant.defects.length) {
      const t = setTimeout(() => setVisible([]), 3500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible((p) => [...p, variant.defects[p.length].id]), 850)
    return () => clearTimeout(t)
  }, [visible, variant, reducedMotion])
  useEffect(() => { setVisible([]) }, [variantIdx])

  const heroClaim = variant.defects.filter((d) => visible.includes(d.id)).reduce((s, d) => s + d.cost, 0)
  const latestId = visible[visible.length - 1]
  const [hoveredDefect, setHoveredDefect] = useState<number | null>(null)
  const chainedId = hoveredDefect ?? latestId

  // Interactive defect reassign
  const [assign, setAssign] = useState<Record<number, Liability>>({})
  useEffect(() => {
    const next: Record<number, Liability> = {}
    for (const d of variant.defects) next[d.id] = d.liability
    setAssign(next)
  }, [variant])

  const interactiveClaim =
    variant.defects.filter((d) => assign[d.id] === "tenant").reduce((s, d) => s + d.cost, 0) +
    variant.defects.filter((d) => assign[d.id] === "shared").reduce((s, d) => s + Math.round(d.cost / 2), 0)

  // Workflow scroll sync
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    const pickActive = () => {
      const centerY = window.innerHeight * 0.45
      let bestIdx = 0
      let bestDist = Infinity
      stepRefs.current.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const dist = Math.abs(midY - centerY)
        if (dist < bestDist) { bestDist = dist; bestIdx = idx }
      })
      setActiveStep(bestIdx)
    }
    pickActive()
    window.addEventListener("scroll", pickActive, { passive: true })
    window.addEventListener("resize", pickActive)
    return () => {
      window.removeEventListener("scroll", pickActive)
      window.removeEventListener("resize", pickActive)
    }
  }, [])

  // Scrolled nav shadow
  useEffect(() => {
    const nav = document.getElementById("rn-nav")
    if (!nav) return
    const handler = () => nav.classList.toggle("scrolled", window.scrollY > 40)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  // UK live map pulses
  const [pulseIdx, setPulseIdx] = useState<number | null>(null)
  const [rail, setRail] = useState<{ city: typeof UK_CITIES[number]; defect: string; amt: number; id: number }[]>([])
  const railIdRef = useRef(0)
  useEffect(() => {
    if (reducedMotion) return
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { timers.delete(t); fn() }, ms)
      timers.add(t)
    }
    const pulse = () => {
      const idx = Math.floor(Math.random() * UK_CITIES.length)
      setPulseIdx(idx)
      const city = UK_CITIES[idx]
      const defect = RAIL_DEFECTS[Math.floor(Math.random() * RAIL_DEFECTS.length)]
      const amt = 25 + Math.floor(Math.random() * 270)
      const id = ++railIdRef.current
      setRail((r) => [{ city, defect, amt, id }, ...r].slice(0, 8))
      schedule(() => setPulseIdx(null), 2400)
      schedule(pulse, 900 + Math.random() * 1400)
    }
    schedule(pulse, 600)
    return () => { timers.forEach(clearTimeout); timers.clear() }
  }, [reducedMotion])

  // Live active-cases counter
  const [activeCases, setActiveCases] = useState(412)
  useEffect(() => {
    if (reducedMotion) return
    const t = setInterval(() => {
      setActiveCases((v) => {
        const next = v + Math.floor(Math.random() * 5) - 2
        if (next < 380) return 380
        if (next > 460) return 460
        return next
      })
    }, 2200)
    return () => clearInterval(t)
  }, [reducedMotion])

  // Live decision feed counter
  const [feedCount, setFeedCount] = useState(17342)
  useEffect(() => {
    if (reducedMotion) return
    const t = setInterval(() => setFeedCount((v) => v + Math.floor(Math.random() * 3) + 1), 2800)
    return () => clearInterval(t)
  }, [reducedMotion])

  const feedItems = useMemo(
    () => (reducedMotion ? DECISIONS.slice(0, 5) : [...DECISIONS, ...DECISIONS, ...DECISIONS]),
    [reducedMotion],
  )

  return (
    <div className="dark-header relative min-h-screen overflow-x-clip bg-[#05070e] text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[15%] top-[-15%] h-[900px] w-[900px] rounded-full bg-emerald-500/[0.12] blur-[160px]" />
        <div className="absolute right-[-5%] top-[25%] h-[700px] w-[700px] rounded-full bg-cyan-500/[0.06] blur-[160px]" />
        <div className="absolute left-[5%] bottom-[-15%] h-[800px] w-[800px] rounded-full bg-violet-500/[0.05] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
      </div>

      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* ═══ NAV ═══ */}
      <nav
        id="rn-nav"
        className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-[#05070e]/70 backdrop-blur-xl transition-colors duration-300 [&.scrolled]:bg-[#05070e]/90"
      >
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <Link href="/" aria-label="Renovo AI home" className="inline-flex shrink-0 items-center">
            <BrandMark />
          </Link>
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <SignInLink className="hidden text-sm text-white/60 transition-colors hover:text-white lg:inline-flex">Sign in</SignInLink>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              Book a demo
            </Link>
            <details className="group relative lg:hidden">
              <summary className="inline-flex min-h-10 list-none items-center rounded-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <div className="absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-xl border border-white/10 bg-[#0a0e1a] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
                <nav className="grid gap-1" aria-label="Mobile navigation">
                  {mobileNavLinks.map((item) => (
                    <Link key={item.label} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.04] hover:text-white">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
                  <SignInLink className="rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.04] hover:text-white">Sign in</SignInLink>
                  <Link href="/book-demo" className="rounded-md bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-400">Book a demo</Link>
                </div>
              </div>
            </details>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1} className="relative z-10">
        {/* ═══ HERO ═══ */}
        <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-40 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-1.5 text-[12px] font-medium text-emerald-400 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                End of tenancy · Built for UK letting agencies
              </div>
              <h1 className="text-[clamp(32px,5.5vw,72px)] font-semibold leading-[1.04] tracking-[-0.035em] [overflow-wrap:anywhere]">
                Close every tenancy in days,{" "}
                <span className="bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                  not weeks.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/60">
                Renovo pulls checkout evidence straight from your inventory app, drafts a defensible deposit decision with reasoning, and routes it to your property manager to sign off. Eight days from checkout to released deposit. 91% scheme award rate.
              </p>
              <HeroTypewriter prompts={variant.prompts} reducedMotion={reducedMotion} />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/book-demo" className="group inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                  Book a demo
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/how-it-works" className="rounded-lg border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.05]">
                  See how it works
                </Link>
              </div>
              <div className="mt-10 grid max-w-[520px] grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { v: "8.4", unit: "d", label: "Avg resolution", detail: "vs 25.6 days industry" },
                  { v: "<2", unit: "m", label: "Deduction letter", detail: "down from 45 min" },
                  { v: "91", unit: "%", label: "Scheme award rate", detail: "rolling 30 days" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
                  >
                    <div className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-emerald-300">
                      {s.v}
                      <span className="ml-0.5 text-[16px] font-medium text-white/50">{s.unit}</span>
                    </div>
                    <div className="mt-2.5 text-[11px] font-medium leading-snug text-white/60">
                      {s.label}
                      <em className="not-italic mt-0.5 block text-[10px] font-normal text-white/30">{s.detail}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live panel */}
            <div className="relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/40 via-emerald-500/5 to-transparent" />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.045] to-white/[0.015] shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    </div>
                    <div className="font-mono text-[11px] text-white/40">{variant.id} · {variant.property}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] text-emerald-400">
                    <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${reducedMotion ? "" : "animate-pulse"}`} />
                    LIVE
                  </div>
                </div>
                <div className="border-b border-white/[0.05] px-5 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Proposed claim</span>
                    <span className="text-[10px] text-white/35">of {fmt(variant.deposit)} deposit</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-mono text-4xl font-semibold tabular-nums">{fmt(heroClaim)}</span>
                    <span className="font-mono text-[11px] text-emerald-400">{visible.length} / {variant.defects.length} defects</span>
                  </div>
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.round((heroClaim / variant.deposit) * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 px-3 py-3">
                  {variant.defects.map((d) => {
                    const isVisible = visible.includes(d.id)
                    const isChained = isVisible && d.id === chainedId
                    const reasons = [
                      { t: `${d.exhibits} photo exhibits`, src: true },
                      { t: `${variant.tenancyMonths}mo tenancy` },
                      { t: `fair wear ×${wearFactor(variant.tenancyMonths)}` },
                      { t: d.precedent },
                    ]
                    return (
                      <div
                        key={d.id}
                        onMouseEnter={() => setHoveredDefect(d.id)}
                        onMouseLeave={() => setHoveredDefect(null)}
                        className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                          isVisible
                            ? "translate-y-0 border-white/[0.06] bg-white/[0.03] opacity-100"
                            : "-translate-y-2 border-transparent opacity-0"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 h-6 w-[3px] shrink-0 rounded-full ${
                            d.severity === "high" ? "bg-rose-500" : d.severity === "medium" ? "bg-amber-500" : "bg-slate-500"
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium">{d.title}</span>
                              <LiabilityPill liability={d.liability} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
                              <span>{d.room}</span>
                              <span>·</span>
                              <span className={d.confidence > 80 ? "text-emerald-400" : d.confidence > 60 ? "text-amber-400" : "text-rose-400"}>
                                {d.confidence}% conf.
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums">{fmt(d.cost)}</div>
                        </div>
                        <div
                          className={`mt-2 flex flex-wrap items-center gap-1.5 overflow-hidden transition-all duration-300 ${
                            isChained ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          {reasons.map((r, i) => (
                            <span key={r.t} className="inline-flex items-center gap-1.5">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em] ${
                                  r.src
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/[0.03] text-white/55"
                                }`}
                              >
                                {r.t}
                              </span>
                              {i < reasons.length - 1 && <span className="text-white/25">→</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-white/[0.05] bg-black/20 px-5 py-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Adjudicator prediction · {variant.scheme}</span>
                    <span className="font-medium text-emerald-400">~{variant.prediction}% award likely</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TRUST STRIP ═══ */}
        <section className="border-y border-white/[0.04] bg-white/[0.008]">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 lg:px-10">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Connects to</span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-white/55">
              {["Reapit", "Jupix", "Alto", "MRI Qube", "InventoryBase", "Inventory Hive"].map((l) => (
                <span key={l}>{l}</span>
              ))}
              <span className="text-white/15">|</span>
              {["SDS", "DPS", "TDS", "mydeposits"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHY AGENCIES SWITCH ═══ */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Why agencies switch</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.035em]">
            Checkout becomes a defensible decision, not a weekend of admin.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Property managers stitch every checkout across inventory apps, shared drives, email, Word docs, and scheme portals. Renovo replaces the stitch with one workspace — and a decision trail the scheme will uphold.
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                ic: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
                stat: "92", unit: "%", label: "Less admin per case.",
                desc: "From two to three hours of retyping evidence to fifteen minutes of manager review. Property managers spend their time on tenancies, not document wrangling.",
              },
              {
                ic: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
                stat: "91", unit: "%", label: "Scheme award rate.",
                desc: "Every liability call cites photo exhibits, fair wear factor, and scheme precedent. Adjudication bundles assemble themselves: timeline, evidence, reasoning, all attached.",
              },
              {
                ic: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" /></>),
                stat: "8", unit: "/8", label: "UK schemes, one workflow.",
                desc: "Direct connectors to SafeDeposits Scotland, DPS, TDS and mydeposits. Submit adjudication bundles without copying and pasting into four different portals.",
              },
            ].map((o) => (
              <div
                key={o.label}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-7 transition-all hover:-translate-y-0.5 hover:border-emerald-500/20"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/[0.06] opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{o.ic}</svg>
                </div>
                <div className="font-mono text-[44px] font-semibold tracking-[-0.035em] tabular-nums text-emerald-400">
                  {o.stat}<span className="text-[0.6em] text-emerald-400/70">{o.unit}</span>
                </div>
                <div className="mt-3 text-[15px] font-semibold">{o.label}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{o.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ WORKFLOW (scroll-synced) ═══ */}
        <section className="relative px-6 py-24 lg:px-10">
          <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">How it works</p>
              <h2 className="mt-4 text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.035em]">
                Checkout to deposit release,
                <br />
                in one system.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
                AI drafts the repeatable bits. Managers approve where judgement matters. Scheme ready at every step.
              </p>
              <div className="mt-12 space-y-6 pb-[30vh]">
                {WORKFLOW_STEPS.map((s, i) => {
                  const isActive = activeStep === i
                  return (
                    <div
                      key={s.n}
                      ref={(el) => { stepRefs.current[i] = el }}
                      className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                        isActive
                          ? "border-emerald-500/40 bg-emerald-500/[0.05] shadow-[0_0_40px_rgba(16,185,129,0.08)]"
                          : "border-white/[0.05] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-colors ${
                          isActive
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                            : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {s.n}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">{s.k}</span>
                          <h3 className="mt-1 text-[15px] font-semibold">{s.h}</h3>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{s.p}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative hidden h-full lg:block">
              <div className="sticky top-24">
                <WorkspaceMockup activeStep={activeStep} variant={variant} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">What operators tell us</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.035em]">
            Feedback from property managers, not sales teams.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Our customers run live residential letting portfolios across the UK. Full names and agency logos available on request — most compliance teams prefer we keep them off the public site.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { q: "What used to be two hours of checkout paperwork is now fifteen minutes of review. Across 1,200 tenancies, that is the single biggest operational lever we have pulled this year.", i: "JM", name: "Head of Lettings", role: "Edinburgh agency · 1,200 tenancies" },
              { q: "When a dispute reaches adjudication, everything we need is already there — photos, reasoning, scheme precedent. We stopped losing cases on incomplete evidence packs three months in.", i: "SK", name: "Branch Director", role: "Glasgow & Paisley · 480 tenancies" },
              { q: "Reapit connected in an afternoon. The first checkout came back the next morning with a drafted deduction letter that needed two line edits. That is when the team knew.", i: "RA", name: "Property Manager", role: "Central London · 340 tenancies" },
            ].map((p) => (
              <div key={p.i} className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-7">
                <p className="text-[15px] leading-[1.65] text-white/80">&ldquo;{p.q}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 font-mono text-[11px] font-semibold text-emerald-300">
                    {p.i}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11px] text-white/45">{p.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ INTERACTIVE DEMO ═══ */}
        <section className="mx-auto max-w-[1080px] px-6 py-24 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Try it yourself</p>
          <h2 className="mt-4 text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.035em]">
            Reassign a defect.
            <br />
            Watch the claim change.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Realistic scenarios, fictional tenancies. The logic, reasoning model, and claim mechanics are identical to what a property manager sees in the live workspace.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent p-6 backdrop-blur-xl">
            <div className="grid gap-8 md:grid-cols-[1fr_1px_260px]">
              <div className="space-y-2">
                {variant.defects.map((d) => (
                  <div key={d.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">{d.title}</div>
                        <div className="mt-0.5 text-[11px] text-white/40">
                          {d.room} · <span className="font-mono">{fmt(d.cost)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {(["tenant", "shared", "landlord"] as const).map((k) => {
                          const sel = assign[d.id] === k
                          const colorWhenSel =
                            k === "tenant"
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                              : k === "shared"
                                ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                                : "border-sky-500/50 bg-sky-500/15 text-sky-300"
                          return (
                            <button
                              key={k}
                              onClick={() => setAssign((a) => ({ ...a, [d.id]: k }))}
                              title={k.charAt(0).toUpperCase() + k.slice(1)}
                              className={`group/btn flex h-7 items-center justify-center rounded-md border px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all hover:px-3 ${
                                sel ? colorWhenSel : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/80"
                              }`}
                            >
                              <span className="inline-block group-hover/btn:hidden">{k.charAt(0)}</span>
                              <span className="hidden group-hover/btn:inline">{k}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden h-auto w-px bg-white/[0.05] md:block" />
              <div className="flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Claim total</div>
                <div className="mt-2 font-mono text-5xl font-semibold tabular-nums">{fmt(interactiveClaim)}</div>
                <div className="mt-1 text-[12px] text-white/50">of {fmt(variant.deposit)} deposit</div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((interactiveClaim / variant.deposit) * 100))}%` }}
                  />
                </div>
                <div className="mt-5 flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Returns to tenant</span>
                  <span className="font-mono tabular-nums text-emerald-400">{fmt(Math.max(0, variant.deposit - interactiveClaim))}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-white/40">% of deposit claimed</span>
                  <span className="font-mono tabular-nums text-white/60">{Math.min(100, Math.round((interactiveClaim / variant.deposit) * 100))}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE BAND — UK map ═══ */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
          <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Live across the UK</p>
              <h2 className="mt-4 text-[clamp(28px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.035em]">
                Scheme activity, in real time.
              </h2>
            </div>
            <p className="text-[14px] leading-relaxed text-white/55">
              Cases resolving across Scotland, England &amp; Wales, and Northern Ireland right now. Every pulse is a draft, a review, or a deposit released through Renovo.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <LiveCounter k="Active cases" v={activeCases.toString()} d="across 47 agencies" />
            <LiveCounter k="Award rate" v="91" suffix="%" d="rolling 30 days" />
            <LiveCounter k="Avg resolution" v="8.4" suffix=" d" d="vs 25.6 industry" />
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <UKMap pulseIdx={pulseIdx} reducedMotion={reducedMotion} />
            <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-5">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Resolving now</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-emerald-400">
                  <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${reducedMotion ? "" : "animate-pulse"}`} />
                  LIVE
                </span>
              </div>
              <div className="space-y-1.5">
                {rail.length === 0 && (
                  <div className="py-8 text-center text-[11px] text-white/30">{reducedMotion ? "Motion reduced" : "Listening for resolutions…"}</div>
                )}
                {rail.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2 text-[11px]">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${schemeColor(r.city.scheme)}`}>
                      {r.city.scheme.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-white/50">{r.city.pc}</span>
                    <span className="flex-1 truncate text-white/75">{r.defect}</span>
                    <span className="font-mono tabular-nums text-emerald-300">{fmt(r.amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ LIVE DECISION FEED (marquee) ═══ */}
        <section className="border-y border-white/[0.04] bg-white/[0.008]">
          <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold uppercase tracking-[0.18em] text-white/45">Live decision feed · UK schemes</span>
              <span className="text-white/45">
                <b className="font-mono font-semibold tabular-nums text-white">{feedCount.toLocaleString("en-GB")}</b> resolved · last 7 days
              </span>
            </div>
            <div className="relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[140px]"
                style={{ background: "linear-gradient(90deg, #05070e, transparent)" }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-[140px]"
                style={{ background: "linear-gradient(270deg, #05070e, transparent)" }}
              />
              <div
                className="flex gap-3 whitespace-nowrap"
                style={{ animation: reducedMotion ? undefined : "feedSlide 70s linear infinite", width: reducedMotion ? undefined : "max-content" }}
              >
                {feedItems.map((d, i) => (
                  <FeedCard key={`${d.cite}-${i}`} d={d} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-[1080px] overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-transparent p-14 text-center backdrop-blur-xl">
            <h2 className="text-[clamp(30px,4.5vw,52px)] font-semibold leading-[1.08] tracking-[-0.035em]">
              Every deposit decision,
              <br />
              <span className="bg-gradient-to-br from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                defensible the moment it is made.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">
              Enterprise software for end of tenancy, built for UK letting agencies. Scheme native. Audit first. UK GDPR, ICO ZC112030, data hosted in London.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/book-demo" className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                Book a demo →
              </Link>
              <Link href="/pricing" className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium hover:bg-white/[0.03]">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ DARK FOOTER ═══ (dual_footer: keep parallel with MarketingShell) */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-[#05070e] px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 border-b border-white/[0.04] pb-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Renovo AI home">
                <BrandMark size={26} />
              </Link>
              <p className="mt-3 max-w-[280px] text-[13px] leading-[1.7] text-white/55">
                Enterprise software for end of tenancy. Built for UK letting agencies. AI assists, humans decide.
              </p>
            </div>
            {Object.entries(footerCols).map(([title, links]) => (
              <div key={title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-400">{title}</p>
                <nav className="mt-4 grid gap-0.5">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="text-[13px] leading-[2.3] text-white/50 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-2 pt-6 text-xs text-white/40 md:flex-row md:justify-between">
            <span>Renovo AI Ltd · SC833544 · VAT GB483379648 · ICO ZC112030</span>
            <span>© 2026 Renovo AI Ltd</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes feedSlide {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        @keyframes ukPing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(7); opacity: 0; }
        }
        @keyframes heroCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroTypewriter({ prompts, reducedMotion }: { prompts: string[]; reducedMotion: boolean }) {
  const [text, setText] = useState(prompts[0] ?? "")
  const promptIdx = useRef(0)
  const typedLen = useRef(0)
  const typing = useRef(true)

  useEffect(() => {
    promptIdx.current = 0
    typedLen.current = 0
    typing.current = true
    if (reducedMotion) {
      setText(prompts[0] ?? "")
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const tick = () => {
      if (cancelled) return
      const current = prompts[promptIdx.current] ?? ""
      if (typing.current && typedLen.current < current.length) {
        typedLen.current += 1
        setText(current.slice(0, typedLen.current))
        timer = setTimeout(tick, 40)
      } else if (typing.current) {
        timer = setTimeout(() => { typing.current = false; tick() }, 1800)
      } else if (typedLen.current > 0) {
        typedLen.current -= 1
        setText(current.slice(0, typedLen.current))
        timer = setTimeout(tick, 18)
      } else {
        promptIdx.current = (promptIdx.current + 1) % prompts.length
        typing.current = true
        tick()
      }
    }
    tick()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [prompts, reducedMotion])

  return (
    <div className="mt-6 min-h-[22px] font-mono text-[13px] text-white/55">
      <span className="text-emerald-400">→ </span>
      {text}
      {!reducedMotion && (
        <span
          className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[3px] bg-emerald-400"
          style={{ animation: "heroCursor 1.2s ease-in-out infinite" }}
        />
      )}
    </div>
  )
}

function LiabilityPill({ liability }: { liability: Liability }) {
  const cls =
    liability === "tenant"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : liability === "shared"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-sky-500/30 bg-sky-500/10 text-sky-300"
  return (
    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${cls}`}>
      {liability}
    </span>
  )
}

function LiveCounter({ k, v, d, suffix }: { k: string; v: string; d: string; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{k}</div>
      <div className="mt-2 font-mono text-[36px] font-semibold tracking-[-0.03em] tabular-nums text-white">
        {v}
        {suffix && <span className="text-[0.55em] font-medium text-white/55">{suffix}</span>}
      </div>
      <div className="mt-1 text-[11px] text-white/40">{d}</div>
    </div>
  )
}

function schemeColor(scheme: UkScheme) {
  switch (scheme) {
    case "sds":
      return "border border-sky-500/40 bg-sky-500/10 text-sky-300"
    case "mdp":
      return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    case "dps":
      return "border border-amber-500/40 bg-amber-500/10 text-amber-300"
    case "tds":
      return "border border-violet-500/40 bg-violet-500/10 text-violet-300"
  }
}

function schemeDotColor(scheme: UkScheme) {
  switch (scheme) {
    case "sds": return "#7dd3fc"
    case "mdp": return "#6ee7b7"
    case "dps": return "#fcd34d"
    case "tds": return "#c4b5fd"
  }
}

function UKMap({ pulseIdx, reducedMotion }: { pulseIdx: number | null; reducedMotion: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-white/[0.05] aspect-[4/5] lg:aspect-auto lg:min-h-[560px]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 45% 55%, rgba(16,185,129,0.06), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.005))",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {UK_CONNECTIONS.map(([a, b], i) => (
          <line
            key={i}
            x1={UK_CITIES[a].x}
            y1={UK_CITIES[a].y}
            x2={UK_CITIES[b].x}
            y2={UK_CITIES[b].y}
            stroke="rgba(16,185,129,0.08)"
            strokeWidth="0.15"
            strokeDasharray="0.8 0.8"
          />
        ))}
      </svg>
      {UK_CITIES.map((c, i) => {
        const isPulse = pulseIdx === i && !reducedMotion
        const color = schemeDotColor(c.scheme)
        return (
          <div
            key={c.name}
            className="group absolute z-[2]"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div
              className="relative h-2 w-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
            {isPulse && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: color,
                  animation: "ukPing 2.4s ease-out",
                }}
              />
            )}
            <span
              className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded border border-white/[0.05] bg-[rgba(5,7,14,0.75)] px-1.5 py-0.5 font-mono text-[9px] text-white/60 backdrop-blur-sm transition-opacity ${
                isPulse ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {c.name} · {c.pc} · {c.scheme.toUpperCase()}
            </span>
          </div>
        )
      })}
      <div className="absolute inset-x-4 bottom-4 z-[3] flex flex-wrap gap-x-4 gap-y-2 rounded-[10px] border border-white/[0.05] bg-[rgba(5,7,14,0.5)] px-3.5 py-2.5 text-[10px] backdrop-blur">
        {([
          { k: "sds", l: "SafeDeposits Scotland" },
          { k: "mdp", l: "mydeposits" },
          { k: "dps", l: "DPS" },
          { k: "tds", l: "TDS" },
        ] as const).map((s) => (
          <span key={s.k} className="inline-flex items-center gap-1.5">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: schemeDotColor(s.k), boxShadow: `0 0 6px ${schemeDotColor(s.k)}` }}
            />
            <span className="font-mono text-[10px] text-white/70">{s.l}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function FeedCard({ d }: { d: Decision }) {
  const outCls =
    d.out === "awarded"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : d.out === "part"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
  const amtCls = d.out === "awarded" ? "text-emerald-300" : d.out === "part" ? "text-amber-300" : "text-rose-300"
  return (
    <div className="inline-flex min-w-[320px] items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
      <div className={`font-mono text-[13px] font-semibold tabular-nums ${amtCls}`}>
        {d.amt === 0 ? "£0" : fmt(d.amt)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-white/80">{d.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-white/40">
          <span>{d.pc}</span><span className="text-white/20">·</span>
          <span>{d.mo}mo</span><span className="text-white/20">·</span>
          <span>{d.scheme}</span><span className="text-white/20">·</span>
          <span>{d.cite}</span>
        </div>
      </div>
      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${outCls}`}>
        {d.out}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORKSPACE MOCKUP (sticky on workflow section)
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkspaceMockup({ activeStep, variant }: { activeStep: number; variant: CaseVariant }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="font-mono text-[11px] text-white/40">{variant.id} · {variant.property}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {WORKFLOW_STEPS[activeStep].k.toUpperCase()}
        </div>
      </div>
      <div className="border-b border-white/[0.05] p-3">
        <div className="grid grid-cols-7 gap-1">
          {STEP_TABS.map((s, i) => (
            <div
              key={s}
              className={`rounded-md px-2 py-2 text-center text-[10px] font-medium transition-colors ${
                i < activeStep
                  ? "bg-emerald-500/[0.08] text-emerald-400/70"
                  : i === activeStep
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                    : "bg-white/[0.02] text-white/25"
              }`}
            >
              {s.slice(0, 3)}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-[320px] p-5">
        <StepContent activeStep={activeStep} variant={variant} />
      </div>
    </div>
  )
}

function StepContent({ activeStep, variant }: { activeStep: number; variant: CaseVariant }) {
  const totalClaim = variant.defects.reduce((s, d) => s + d.cost, 0)

  if (activeStep === 0) {
    const docs = [
      { label: "Check in inventory", meta: "InventoryBase · 14 pages" },
      { label: "Checkout inventory", meta: "Uploaded · 18 pages" },
      { label: "Tenancy agreement", meta: "Reapit sync · 9 pages" },
      { label: "Move out photos", meta: "12 images · EXIF verified" },
    ]
    return (
      <div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Documents ingested</div>
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.label} className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium">{d.label}</div>
                <div className="text-[10px] text-white/40">{d.meta}</div>
              </div>
              <div className="font-mono text-[10px] text-emerald-400">Linked</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeStep === 1) {
    const rooms = [
      { name: "Living Room", before: "Good", after: "Fair" },
      { name: "Kitchen", before: "Good", after: "Poor" },
      { name: "Master Bedroom", before: "Excellent", after: "Fair" },
      { name: "Bathroom", before: "Good", after: "Good" },
      { name: "Hallway", before: "Good", after: "Fair" },
    ]
    const condCls = (c: string) =>
      c === "Poor" ? "bg-rose-500/10 text-rose-300"
      : c === "Fair" ? "bg-amber-500/10 text-amber-300"
      : "bg-emerald-500/10 text-emerald-300"
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Room conditions</div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Analysing
          </div>
        </div>
        <div className="space-y-1.5">
          {rooms.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className="flex-1 text-[12px] font-medium">{r.name}</div>
              <span className={`rounded px-2 py-0.5 text-[10px] ${condCls(r.before)}`}>{r.before}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className={`rounded px-2 py-0.5 text-[10px] ${condCls(r.after)}`}>{r.after}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeStep === 2) {
    return (
      <div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">AI draft · {variant.defects.length} defects</div>
        <div className="space-y-1.5">
          {variant.defects.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className={`h-5 w-[3px] rounded-full ${d.severity === "high" ? "bg-rose-500" : d.severity === "medium" ? "bg-amber-500" : "bg-slate-500"}`} />
              <div className="flex-1 truncate text-[12px]">{d.title}</div>
              <LiabilityPill liability={d.liability} />
              <span className={`font-mono text-[10px] ${d.confidence > 80 ? "text-emerald-400" : d.confidence > 60 ? "text-amber-400" : "text-rose-400"}`}>
                {d.confidence}%
              </span>
              <div className="font-mono text-[11px] tabular-nums text-white/70">{fmt(d.cost)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2.5">
          <span className="text-[11px] text-white/50">Total proposed</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-emerald-300">{fmt(totalClaim)}</span>
        </div>
      </div>
    )
  }

  if (activeStep === 3) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Manager review</div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">All reviewed</span>
        </div>
        <div className="space-y-1.5">
          {variant.defects.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="flex-1 truncate text-[12px]">{d.title}</div>
              <div className="font-mono text-[11px] tabular-nums text-white/70">{fmt(d.cost)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Audit trail</div>
          <div className="space-y-0.5 font-mono text-[10px] text-white/50">
            <div>10:42 · JM · liability tenant → shared (D3)</div>
            <div>10:43 · JM · cost £90 → £75 (D3)</div>
            <div>10:45 · JM · approved all</div>
          </div>
        </div>
      </div>
    )
  }

  if (activeStep === 4) {
    const toTenant = variant.deposit - totalClaim
    const pct = Math.round((totalClaim / variant.deposit) * 100)
    return (
      <div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Deposit released</div>
        <div className="mb-4 flex items-center gap-5">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgb(14 165 233 / 0.4)" strokeWidth="14" />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${(pct / 100) * 238.76} 238.76`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-sm font-semibold">{pct}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">To landlord</div>
                <div className="font-mono text-[15px] font-semibold tabular-nums text-emerald-300">{fmt(totalClaim)}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-sky-500/15 bg-sky-500/5 px-3 py-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">To tenant</div>
                <div className="font-mono text-[15px] font-semibold tabular-nums text-sky-300">{fmt(toTenant)}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-sky-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2.5">
          <span className="text-[11px] text-white/50">Released via {variant.scheme}</span>
          <span className="font-mono text-[10px] text-emerald-400">✓ Complete</span>
        </div>
      </div>
    )
  }

  if (activeStep === 5) {
    const exhibits = [
      "Exhibit A. Signed check in inventory",
      "Exhibit B. Signed checkout inventory",
      "Exhibit C. Move out photographs (12)",
      "Exhibit D. Tenancy agreement",
      "Exhibit E. Contractor quotes (2)",
      "Exhibit F. Tenant correspondence",
    ]
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Adjudication bundle</div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Ready</span>
        </div>
        <div className="space-y-1.5">
          {exhibits.map((e) => (
            <div key={e} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <div className="flex-1 truncate text-[12px]">{e}</div>
              <span className="text-[10px] text-emerald-400">✓</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
          <span className="text-[11px] text-white/60">Predicted award</span>
          <span className="font-mono text-sm font-semibold text-emerald-300">~{variant.prediction}%</span>
        </div>
      </div>
    )
  }

  return null
}
