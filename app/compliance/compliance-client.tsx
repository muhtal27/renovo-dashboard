import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

export default function ComplianceClient() {
  return (
    <MarketingShell currentPath="/compliance">
      <div className="page-shell page-stack">

        {/* ── HERO ── */}
        <section className="page-hero">
          <p className="app-kicker">Compliance</p>
          <h1 className="page-title max-w-[820px]">
            Security, privacy, and <em>data handling</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI processes tenancy evidence, liability assessments, and
            deposit decisions. This page outlines how that data is hosted,
            accessed, retained, and protected.
          </p>
        </section>

        {/* ── DATA HOSTING ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Infrastructure</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Data hosting and <em className="text-zinc-500">residency</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Hosting region", desc: "All production data is hosted in London, United Kingdom. No tenancy or case data leaves the UK." },
              { label: "Infrastructure provider", desc: "Cloud infrastructure managed through Supabase (AWS eu-west-2) with encryption at rest and in transit." },
              { label: "Application hosting", desc: "Frontend and API services deployed on Vercel with London region routing (lhr1) to minimise latency." },
              { label: "Backups", desc: "Automated daily backups with point-in-time recovery. Backup data remains within the same hosting region." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── ACCESS CONTROL ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Access control</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Authentication and <em className="text-zinc-500">authorisation</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Authentication", desc: "SSO via Microsoft Entra ID (Azure AD). Staff sign in with their existing agency credentials. No separate passwords." },
              { label: "Role-based access", desc: "Platform permissions are scoped by role and branch. Operators see their assigned cases. Managers see portfolio-level data." },
              { label: "Session management", desc: "Sessions are time-limited with automatic expiry. Re-authentication required after inactivity." },
              { label: "SSO add-on", desc: "SAML-based identity providers supported as an optional add-on for agencies not on Microsoft 365." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── DATA PRIVACY ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Privacy</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            UK GDPR and <em className="text-zinc-500">data protection</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Legal basis", desc: "Personal data is processed under legitimate interest and contractual necessity for the letting agency as data controller." },
              { label: "Data categories", desc: "Tenant names, tenancy addresses, deposit amounts, checkout evidence (photos, reports), and case decisions." },
              { label: "AI processing", desc: "Tenancy data is processed by AI to draft liability assessments. It is not used to train models or shared with third parties for any other purpose." },
              { label: "Subject rights", desc: "Data subject access requests, erasure requests, and portability requests are handled within statutory timescales." },
              { label: "Privacy notice", desc: "Full privacy notice available at renovoai.co.uk/privacy. Data protection enquiries to hello@renovoai.co.uk." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── AUDIT AND RETENTION ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Audit and retention</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Traceability and <em className="text-zinc-500">record keeping</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Audit trail", desc: "Every case action, edit, approval, rejection, and note is logged with a timestamp and the name of the person who made it." },
              { label: "Immutability", desc: "Audit records cannot be edited or deleted by platform users. The trail supports scheme-level scrutiny if a case is disputed." },
              { label: "Retention", desc: "Case data retained in line with the customer agreement. Standard retention is 3 years. Enterprise customers can configure custom retention periods." },
              { label: "Deletion", desc: "On contract termination, customer data is deleted within 90 days unless a longer retention period is agreed or required by law." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── SUBPROCESSORS ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Subprocessors</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Third-party <em className="text-zinc-500">services</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Supabase", desc: "Database hosting, authentication, and file storage. London region (eu-west-2)." },
              { label: "Vercel", desc: "Application hosting and edge delivery. London region (lhr1)." },
              { label: "Anthropic", desc: "AI processing for liability assessment drafting. Data processed under DPA. Not used for model training." },
              { label: "Microsoft", desc: "Identity provider for SSO authentication via Entra ID." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── COMPANY ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Company details</p>
          <div className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Company</p>
              <p className="mt-2 text-sm text-zinc-700">Renovo AI Ltd</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Registered</p>
              <p className="mt-2 text-sm text-zinc-700">Edinburgh, Scotland</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Company number</p>
              <p className="mt-2 text-sm text-zinc-700">SC833544</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">VAT</p>
              <p className="mt-2 text-sm text-zinc-700">GB483379648</p>
            </div>
          </div>
          <p className="mt-8 text-sm text-zinc-500">
            For procurement, onboarding, or compliance enquiries contact{" "}
            <a href="mailto:hello@renovoai.co.uk" className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
              hello@renovoai.co.uk
            </a>
          </p>
        </section>

        {/* ── CTA ── */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Need compliance detail for <em className="text-zinc-500">internal review</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-zinc-500">
            Contact us for DPA documentation, security questionnaire responses,
            or additional technical detail.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
              Get started →
            </Link>
            <a href="mailto:hello@renovoai.co.uk?subject=Compliance%20enquiry" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
              Email Renovo AI
            </a>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
