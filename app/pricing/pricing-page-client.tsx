import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

const payg = [
  "Active case workspace",
  "Evidence upload and management",
  "AI-drafted liability assessments",
  "Manager approval workflow",
  "Audit trail and claim output",
  "Priority case tagging",
  "Fair wear and tear guidance hub",
  "Custom claim templates",
  "Dispute pack generation",
  "Multi-user access",
  "Branch-level reporting",
  "Email and chat support",
] as const

const enterprise = [
  "Unlimited users across branches",
  "Unlimited portfolio capacity",
  "Custom audit trail retention",
  "Dedicated account manager",
  "Priority phone support",
  "SLA and compliance review",
  "Multi-branch rollout support",
  "Bespoke onboarding programme",
  "API access for internal tooling",
  "Custom CRM and inventory integrations",
] as const

const addons = [
  { h: "SSO (Single Sign-On)", p: "Sign in via your existing identity provider. Supports Microsoft Entra ID and SAML-based providers." },
  { h: "On-site technical support", p: "Hands-on assistance during rollout. Staff training, workflow configuration, and live troubleshooting." },
  { h: "Custom integrations", p: "Connect Renovo AI to CRM, inventory software, or internal systems beyond standard integrations." },
  { h: "Extended audit retention", p: "Retain case records and evidence trails beyond the standard period. Configurable to compliance needs." },
  { h: "Dedicated onboarding", p: "Structured implementation programme with workspace setup, data migration, and team walkthroughs." },
  { h: "Analytics and reporting", p: "Checkout volume, dispute rates, resolution times, and operator workload across your portfolio." },
] as const

const compare: ({ section: string } | { f: string; payg: string; ent: string })[] = [
  { section: "Core platform" },
  { f: "Active case workspace", payg: "\u2713", ent: "\u2713" },
  { f: "Evidence upload and management", payg: "\u2713", ent: "\u2713" },
  { f: "AI-drafted liability assessments", payg: "\u2713", ent: "\u2713" },
  { f: "Manager approval workflow", payg: "\u2713", ent: "\u2713" },
  { f: "Audit trail and claim output", payg: "\u2713", ent: "\u2713" },
  { f: "Fair wear and tear guidance hub", payg: "\u2713", ent: "\u2713" },
  { f: "Dispute pack generation", payg: "\u2713", ent: "\u2713" },
  { section: "Scale and access" },
  { f: "Portfolio capacity", payg: "Usage-based", ent: "Unlimited" },
  { f: "Team users", payg: "Multi-user", ent: "Unlimited" },
  { f: "Audit trail retention", payg: "Standard", ent: "Custom" },
  { f: "API access", payg: "\u2014", ent: "\u2713" },
  { section: "Support" },
  { f: "Email and chat support", payg: "\u2713", ent: "\u2713" },
  { f: "Dedicated account manager", payg: "\u2014", ent: "\u2713" },
  { f: "Priority phone support", payg: "\u2014", ent: "\u2713" },
  { f: "Bespoke onboarding", payg: "\u2014", ent: "\u2713" },
  { f: "SLA and compliance review", payg: "\u2014", ent: "\u2713" },
  { section: "Integrations" },
  { f: "Standard integrations", payg: "\u2713", ent: "\u2713" },
  { f: "Custom integrations", payg: "\u2014", ent: "\u2713" },
  { f: "SSO (Single Sign-On)", payg: "Add-on", ent: "Add-on" },
]

export const pricingFaqs = [
  { q: "How does Pay As You Go billing work?", a: "You are billed per completed checkout. There is no monthly subscription, no minimum spend, and no contract. Use Renovo AI when you need it and only pay for what you process." },
  { q: "What counts as a completed checkout?", a: "A completed checkout is one case processed through the Renovo AI workflow, from report intake through to deposit release or dispute pack generation. Drafts and incomplete cases are not billed." },
  { q: "Can I move from Pay As You Go to Enterprise?", a: "Yes. You can upgrade at any time. Your existing case history and evidence trails carry over. We will work with you on the transition and onboarding." },
  { q: "Is VAT included?", a: "No. All pricing is exclusive of VAT. UK VAT at the applicable rate (currently 20%) is added to invoices." },
  { q: "Where is data hosted?", a: "All data is hosted in London, UK. Renovo AI complies with UK GDPR requirements. Role-based access and a full audit trail are enabled by default." },
  { q: "What integrations are supported?", a: "Standard integrations include Reapit, Arthur Online, SME Professional, Fixflo, InventoryBase, No Letting Go, and HelloReport. Enterprise customers can request custom integrations." },
] as const

export default function PricingPageClient() {
  return (
    <MarketingShell currentPath="/pricing">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Pricing</p>
          <h1 className="page-title mx-auto mt-4 max-w-[820px]">Start small. <em>Scale when ready.</em></h1>
          <p className="page-copy mx-auto mt-4 max-w-[560px]">Every plan includes the full Renovo AI workflow. Pay per checkout or talk to us about a dedicated setup for your team.</p>
        </section>

        {/* PLAN CARDS */}
        <section className="mx-auto max-w-[960px] px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            {/* PAY AS YOU GO */}
            <div className="rounded-xl border border-zinc-200 bg-white p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500">Flexible</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Pay As You Go</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Full platform access with usage-based billing. No contracts, no minimum commitment.</p>
              <p className="mt-4 rounded-lg bg-emerald-500/[0.06] px-4 py-2.5 text-sm text-zinc-600">One-time setup: &pound;500 + VAT</p>
              <div className="mt-6 border-t border-zinc-200 pt-6">
                <ul className="space-y-2.5">
                  {payg.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-6 text-zinc-600">
                      <span className="mt-0.5 text-emerald-500">&check;</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <Link href="/contact" className="app-primary-button block w-full rounded-md px-4 py-3 text-center text-sm font-medium">Get started &rarr;</Link>
                <p className="mt-3 text-center text-xs text-zinc-400">Billed per completed checkout.</p>
              </div>
            </div>

            {/* ENTERPRISE */}
            <div className="rounded-xl border border-zinc-200 bg-slate-50 p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500">Tailored</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Enterprise</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-500">For multi-branch agencies and portfolios above 5,000 tenancies. Dedicated onboarding, custom integrations, and SLA-backed support.</p>
              <div className="mt-6 border-t border-zinc-200 pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Everything in Pay As You Go, plus</p>
                <ul className="space-y-2.5">
                  {enterprise.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-6 text-zinc-600">
                      <span className="mt-0.5 text-emerald-500">&check;</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8">
                <Link href="/contact" className="app-primary-button block w-full rounded-md px-4 py-3 text-center text-sm font-medium">Talk to us &rarr;</Link>
                <p className="mt-3 text-center text-xs text-zinc-400">Annual agreement. Priced around your portfolio.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ADD-ONS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[960px] px-6 py-24">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Add-ons</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Optional <em className="text-zinc-400">add-ons</em></h2>
            <p className="mt-3 text-base leading-8 text-zinc-500">Available on any plan. Add what your team needs.</p>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {addons.map((a) => (
                <div key={a.h}><h3 className="text-[15px] font-semibold text-zinc-950">{a.h}</h3><p className="mt-2 text-sm leading-7 text-zinc-500">{a.p}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARE TABLE */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Compare</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Compare <em className="text-zinc-400">plans</em></h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-zinc-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-1/2">Feature</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Pay As You Go</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row, i) =>
                  "section" in row ? (
                    <tr key={i}><td colSpan={3} className="bg-slate-50 px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">{row.section}</td></tr>
                  ) : (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="px-4 py-3 text-zinc-600">{row.f}</td>
                      <td className="px-4 py-3 text-center"><span className={row.payg === "\u2713" ? "font-semibold text-emerald-500" : row.payg === "\u2014" ? "text-zinc-300" : "text-zinc-500"}>{row.payg}</span></td>
                      <td className="px-4 py-3 text-center"><span className={row.ent === "\u2713" ? "font-semibold text-emerald-500" : row.ent === "\u2014" ? "text-zinc-300" : "text-zinc-500"}>{row.ent}</span></td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[680px] px-6 py-24">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">FAQ</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Common <em className="text-zinc-400">questions</em></h2>
            <div className="mt-10 divide-y divide-zinc-200">
              {pricingFaqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="cursor-pointer list-none text-sm font-medium text-zinc-950">{f.q}</summary>
                  <p className="mt-3 text-sm leading-7 text-zinc-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Ready to simplify your <em className="text-zinc-400">checkout workflow</em>?</h2>
          <p className="mx-auto mt-4 max-w-[460px] text-base leading-8 text-zinc-500">Tell us about your team and portfolio. We will help you find the right setup.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Get started &rarr;</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
