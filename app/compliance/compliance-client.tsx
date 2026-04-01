import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

const sections = [
  {
    kicker: "Infrastructure",
    title: "Data hosting and",
    em: "residency",
    rows: [
      { l: "Hosting region", d: "All production data hosted in London, United Kingdom. No tenancy or case data leaves the UK." },
      { l: "Infrastructure", d: "Cloud infrastructure managed through Supabase (AWS eu-west-2) with encryption at rest and in transit." },
      { l: "Application hosting", d: "Frontend and API services deployed on Vercel with London region routing (lhr1)." },
      { l: "Backups", d: "Automated daily backups with point-in-time recovery. Backup data remains within the same hosting region." },
    ],
  },
  {
    kicker: "Access control",
    title: "Authentication and",
    em: "authorisation",
    rows: [
      { l: "Authentication", d: "SSO via Microsoft Entra ID (Azure AD). Staff sign in with existing agency credentials. No separate passwords." },
      { l: "Role-based access", d: "Platform permissions scoped by role and branch. Operators see assigned cases. Managers see portfolio-level data." },
      { l: "Session management", d: "Sessions are time-limited with automatic expiry. Re-authentication required after inactivity." },
      { l: "SSO add-on", d: "SAML-based identity providers supported as an optional add-on for agencies not on Microsoft 365." },
    ],
  },
  {
    kicker: "Privacy",
    title: "UK GDPR and",
    em: "data protection",
    rows: [
      { l: "Legal basis", d: "Personal data processed under legitimate interest and contractual necessity for the letting agency as data controller." },
      { l: "Data categories", d: "Tenant names, tenancy addresses, deposit amounts, checkout evidence (photographs, reports), and case decisions." },
      { l: "AI processing", d: "Tenancy data processed by AI to draft liability assessments. Not used to train models or shared with third parties." },
      { l: "Subject rights", d: "Data subject access, erasure, and portability requests handled within statutory timescales." },
      { l: "Privacy notice", d: "Full privacy notice at renovoai.co.uk/privacy. Data protection enquiries to hello@renovoai.co.uk." },
    ],
  },
  {
    kicker: "Audit and retention",
    title: "Traceability and",
    em: "record keeping",
    rows: [
      { l: "Audit trail", d: "Every case action, edit, approval, rejection, and note logged with a timestamp and the name of the person." },
      { l: "Immutability", d: "Audit records cannot be edited or deleted by platform users. Supports scheme-level scrutiny if disputed." },
      { l: "Retention", d: "Standard retention is 3 years. Enterprise customers can configure custom retention periods." },
      { l: "Deletion", d: "On contract termination, customer data deleted within 90 days unless a longer period is required by law." },
    ],
  },
  {
    kicker: "Subprocessors",
    title: "Third-party",
    em: "services",
    rows: [
      { l: "Supabase", d: "Database hosting, authentication, and file storage. London region (eu-west-2)." },
      { l: "Vercel", d: "Application hosting and edge delivery. London region (lhr1)." },
      { l: "Anthropic", d: "AI processing for liability assessment drafting. Data processed under DPA. Not used for model training." },
      { l: "Microsoft", d: "Identity provider for SSO authentication via Entra ID." },
    ],
  },
] as const

export default function ComplianceClient() {
  return (
    <MarketingShell currentPath="/compliance">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">Compliance</p>
          <h1 className="page-title max-w-[820px]">
            Security, privacy, and <em className="text-slate-400">data handling</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI processes tenancy evidence, liability assessments, and
            deposit decisions. This page outlines how that data is hosted,
            accessed, retained, and protected.
          </p>
        </section>

        {/* DATA SECTIONS — alternating tinted */}
        {sections.map((s, idx) => (
          <section key={s.kicker} className={idx % 2 === 0 ? "section-tinted" : ""}>
            <div className="mx-auto max-w-[1080px] px-6 py-24">
              <p className="app-kicker">{s.kicker}</p>
              <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
                {s.title} <em className="text-slate-400">{s.em}</em>
              </h2>
              <div className="mt-14 divide-y divide-slate-200">
                {s.rows.map((r) => (
                  <div key={r.l} className="grid gap-2 py-5 md:grid-cols-[180px_1fr]">
                    <p className="text-sm font-semibold text-zinc-950">{r.l}</p>
                    <p className="text-sm leading-7 text-slate-500">{r.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* COMPANY DETAILS */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">Company details</p>
          <div className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {[
              { l: "Company", v: "Renovo AI Ltd" },
              { l: "Registered", v: "Edinburgh, Scotland" },
              { l: "Company number", v: "SC833544" },
              { l: "VAT", v: "GB483379648" },
              { l: "ICO registration", v: "ZC112030" },
            ].map((d) => (
              <div key={d.l}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{d.l}</p>
                <p className="mt-2 text-sm text-slate-700">{d.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-500">
            For procurement, onboarding, or compliance enquiries contact{" "}
            <a href="mailto:hello@renovoai.co.uk" className="text-emerald-500 hover:underline">hello@renovoai.co.uk</a>
          </p>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Need compliance detail for <em className="text-slate-400">internal review</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-slate-500">
            Contact us for DPA documentation, security questionnaire responses,
            or additional technical detail.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Get started &rarr;</Link>
            <a href="mailto:hello@renovoai.co.uk?subject=Compliance%20enquiry" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">Email Renovo AI</a>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
