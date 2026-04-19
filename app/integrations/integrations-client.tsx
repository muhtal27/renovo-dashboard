import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

type Status = "live" | "beta" | "soon"

type Integration = {
  logo: string
  name: string
  kind: string
  desc: string
  status: Status
}

const SCHEMES: Integration[] = [
  { logo: "SDS", name: "SafeDeposits Scotland", kind: "Scheme · Scotland", desc: "Full connector. Case registration, adjudication bundle submission, and outcome sync.", status: "live" },
  { logo: "mD", name: "mydeposits", kind: "Scheme · UK-wide", desc: "Supports both Scotland and England & Wales schemes under one connector.", status: "live" },
  { logo: "DPS", name: "Deposit Protection Service", kind: "Scheme · England & Wales", desc: "Custodial and insured flows. Bundles pushed directly into the DPS case record.", status: "live" },
  { logo: "TDS", name: "Tenancy Deposit Scheme", kind: "Scheme · England & Wales", desc: "Structured evidence format generated natively. No reformatting of the bundle needed.", status: "live" },
]

const CRMS: Integration[] = [
  { logo: "Re", name: "Reapit AppMarket", kind: "CRM · OAuth2", desc: "Two-way sync via AppMarket: tenancies, landlords, properties, documents.", status: "live" },
  { logo: "Al", name: "Alto by Zoopla", kind: "CRM · Partner API", desc: "Tenancy pull on schedule; outcomes written back as activity entries.", status: "live" },
  { logo: "Jx", name: "Jupix", kind: "CRM · REST", desc: "Tenancy & property sync on tenancy-end. Deduction letters attach back.", status: "live" },
  { logo: "MR", name: "MRI (Qube)", kind: "PropertyTech", desc: "Daily bulk sync of tenancy and property data. Outcomes pushed back as JSON.", status: "live" },
]

const INVENTORY: Integration[] = [
  { logo: "Ib", name: "InventoryBase", kind: "Inventory · Webhook", desc: "Reports delivered via webhook. Photos, annotations, and condition scores imported natively.", status: "live" },
  { logo: "NL", name: "No Letting Go", kind: "Inventory · API", desc: "Dilapidations register and schedule of condition ingest. Scottish variant supported.", status: "live" },
  { logo: "Ih", name: "Inventory Hive", kind: "Inventory · OAuth2", desc: "Check-in vs checkout comparison pulled pre-structured for defect detection.", status: "live" },
  { logo: "PDF", name: "PDF / photo upload", kind: "Universal fallback", desc: "No inventory app? Drop a PDF and a photo folder. Renovo parses and links them.", status: "live" },
]

const OTHER: Integration[] = [
  { logo: "Xr", name: "Xero", kind: "Accounting · OAuth2", desc: "Deposit splits posted to the correct chart-of-accounts line, fully reversible.", status: "beta" },
  { logo: "Sg", name: "Sage Business Cloud", kind: "Accounting · REST", desc: "Dual-sided journal entries for deposit returns. Scottish property CoA supported.", status: "beta" },
  { logo: "M3", name: "Microsoft 365", kind: "Email · Graph API", desc: "Outlook-native sending with SharePoint attachments. SSO via Entra ID.", status: "live" },
  { logo: "Ds", name: "DocuSign", kind: "E-signature", desc: "Tenant sign-off on agreed deduction splits. Signed PDFs attached to the case.", status: "soon" },
]

const GROUPS: { label: string; items: Integration[] }[] = [
  { label: "UK deposit schemes", items: SCHEMES },
  { label: "CRMs & property platforms", items: CRMS },
  { label: "Inventory apps", items: INVENTORY },
  { label: "Accounting, email & e-signature", items: OTHER },
]

function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === "live"
      ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
      : status === "beta"
        ? "border-amber-400/40 bg-amber-50 text-amber-700"
        : "border-slate-300 bg-slate-50 text-slate-500"
  const label = status === "live" ? "Live" : status === "beta" ? "Beta" : "Soon"
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${cls}`}>
      {label}
    </span>
  )
}

function IntegrationCard({ i }: { i: Integration }) {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px] font-semibold tracking-tight text-slate-700">
          {i.logo}
        </div>
        <StatusBadge status={i.status} />
      </div>
      <div className="mt-4 text-[15px] font-semibold leading-tight text-zinc-950">{i.name}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{i.kind}</div>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{i.desc}</p>
    </div>
  )
}

export default function IntegrationsClient() {
  return (
    <MarketingShell currentPath="/integrations">
      <div className="page-shell page-stack">
        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">Integrations</p>
          <h1 className="page-title max-w-[820px]">
            Connects to the tools <em className="text-slate-400">you already run.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            Every UK deposit scheme. The inventory apps and property management platforms your clerks already use. Renovo lives between them. Your CRM stays the source of truth for tenancies. The scheme stays the source of truth for adjudication.
          </p>
        </section>

        {/* INTEGRATION GRID (grouped) */}
        <section className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="space-y-16">
            {GROUPS.map((g) => (
              <div key={g.label}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">{g.label}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {g.items.map((i) => (
                    <IntegrationCard key={i.name} i={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FALLBACK STRIP */}
          <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              <div className="text-[15px] font-semibold text-zinc-950">Can&rsquo;t see your tool?</div>
              <div className="grid gap-3 text-[13px] leading-relaxed text-slate-600 sm:grid-cols-3">
                <div>
                  Public REST API — see{" "}
                  <Link href="/developers" className="font-medium text-emerald-700 underline decoration-emerald-200 underline-offset-2 hover:decoration-emerald-500">
                    Developers
                  </Link>
                </div>
                <div>Webhook bus, eight event types</div>
                <div>Enterprise custom connectors</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA-LITE */}
        <section className="mx-auto max-w-[1200px] px-6 pb-24">
          <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-xl font-semibold leading-tight text-zinc-950">
                Run through a live sync on one of your tenancies.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                We&rsquo;ll connect a sandbox Reapit or Alto test environment and walk through the full round-trip.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/book-demo" className="app-accent-button rounded-lg px-5 py-2.5 text-sm">
                Book a demo &rarr;
              </Link>
              <Link href="/developers" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
                Read API docs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
