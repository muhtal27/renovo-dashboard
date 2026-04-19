"use client"

import { FormEvent, useId, useState } from "react"
import posthog from "posthog-js"
import { MarketingShell } from "@/app/components/MarketingShell"

const BOOKING_URL =
  "https://outlook.office.com/bookwithme/user/df0b78278c634989bd8642429b4df279@renovoai.co.uk/meetingtype/MuagrXaeKESc8zQc19w-MA2?anonymous&ep=mlink"

const ROLES = [
  "Property Manager",
  "Senior / Lead PM",
  "Branch Director",
  "Head of Lettings / Ops",
  "Managing Director / Owner",
  "Investor / Analyst",
  "Other",
] as const
type Role = typeof ROLES[number] | ""

const SIZES = ["Under 200", "200–750", "750–2,500", "2,500+"] as const
type Size = typeof SIZES[number] | ""

const SCHEMES = ["SafeDeposits Scotland", "mydeposits", "DPS", "TDS"] as const
type Scheme = typeof SCHEMES[number] | ""

type FormState = {
  firstName: string
  lastName: string
  workEmail: string
  phone: string
  agency: string
  role: Role
  size: Size
  scheme: Scheme
  note: string
  website: string // honeypot
  consent: boolean
}

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  phone: "",
  agency: "",
  role: "",
  size: "",
  scheme: "",
  note: "",
  website: "",
  consent: false,
}

type FieldName = "firstName" | "lastName" | "workEmail" | "agency" | "role" | "size" | "scheme" | "consent"
type Errors = Partial<Record<FieldName, string>>

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

const PROMISES = [
  {
    title: "30 minutes, not an hour",
    body: "Tight, structured, no slide deck. You bring a case, we bring the workspace.",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  {
    title: "On the call, an operator",
    body: "Someone who has signed off deduction letters, not a sales rep reading a script.",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
  },
  {
    title: "Anonymise before you send",
    body: "Strip tenant personal data, or we will redact it before we touch it. DPA available on request.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: "No commitment after the call",
    body: "If it does not fit, we will say so. If it does, Free covers let only portfolios immediately.",
    icon: <polyline points="20 6 9 17 4 12" />,
  },
] as const

function Segmented<T extends string>({
  name,
  options,
  value,
  onChange,
  error,
}: {
  name: string
  options: readonly T[]
  value: T | ""
  onChange: (v: T) => void
  error?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((o) => {
        const sel = value === o
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={sel}
            aria-label={`${name}: ${o}`}
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              sel
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {o}
          </button>
        )
      })}
      {error && <p className="col-span-2 text-xs text-rose-700 sm:col-span-4">{error}</p>}
    </div>
  )
}

export default function BookDemoClient() {
  const baseId = useId()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [ref, setRef] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const next: Errors = {}
    if (!form.firstName.trim()) next.firstName = "Required"
    if (!form.lastName.trim()) next.lastName = "Required"
    if (!form.workEmail.trim() || !isValidEmail(form.workEmail)) next.workEmail = "Valid work email"
    if (!form.agency.trim()) next.agency = "Required"
    if (!form.role) next.role = "Choose a role"
    if (!form.size) next.size = "Choose a portfolio size"
    if (!form.scheme) next.scheme = "Choose a primary scheme"
    if (!form.consent) next.consent = "Consent required"

    if (Object.keys(next).length > 0) {
      setErrors(next)
      setStatus("idle")
      return
    }

    setSubmitting(true)
    setErrors({})
    setStatus("idle")

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
    const messageParts = [
      `Role: ${form.role}`,
      `Managed tenancies: ${form.size}`,
      `Primary scheme: ${form.scheme}`,
      form.phone ? `Phone: ${form.phone}` : null,
      form.note ? `\n${form.note}` : null,
    ].filter(Boolean)
    const message = messageParts.join("\n")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          workEmail: form.workEmail.trim(),
          companyName: form.agency.trim(),
          enquiryType: "Product enquiry",
          portfolioSize: "",
          message,
          website: form.website,
          sourcePage: "/book-demo",
        }),
      })

      if (!response.ok) {
        setStatus("error")
        return
      }

      posthog.capture("book_demo_submitted", {
        role: form.role,
        tenancy_size: form.size,
        primary_scheme: form.scheme,
      })

      setRef(`BK-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`)
      setForm(INITIAL)
      setStatus("success")
    } catch {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MarketingShell currentPath="/book-demo">
      <div className="page-shell page-stack">
        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">Book a demo</p>
          <h1 className="page-title max-w-[820px]">
            See Renovo on one of <em className="text-slate-400">your real checkouts.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            Send us an anonymised case. We will run it through Renovo live, walk through the reasoning, the draft, and the adjudication bundle, with someone who has managed UK end of tenancy operations on the other end of the call.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="app-accent-button rounded-lg px-5 py-2.5 text-sm"
            >
              Pick a time now &rarr;
            </a>
            <a
              href="#book-form"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              Or send a written request
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Pick a time now opens our live calendar. You get a confirmation straight away.
          </p>
        </section>

        {/* PROMISE + FORM */}
        <section id="book-form" className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-4">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              {PROMISES.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-50 text-emerald-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {p.icon}
                    </svg>
                  </span>
                  <div>
                    <div className="text-[15px] font-semibold text-zinc-950">{p.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-[15px] font-semibold text-zinc-950">Request a walkthrough</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Responds in &lt; 1 business day
                </span>
              </div>

              {status === "success" ? (
                <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-950">Request received</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Thanks. We will be in touch inside one working day with three proposed times.
                  </p>
                  <p className="mt-4 font-mono text-[11px] text-emerald-700">REQ-{ref}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden
                  />

                  {status === "error" && (
                    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      Something went wrong. Please try again or email{" "}
                      <a className="underline" href="mailto:hello@renovoai.co.uk">hello@renovoai.co.uk</a>.
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">First name <span className="text-rose-600">*</span></span>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Priya"
                        autoComplete="given-name"
                        required
                        aria-invalid={!!errors.firstName}
                        className="app-field w-full text-sm outline-none"
                      />
                      {errors.firstName && <p className="mt-1 text-xs text-rose-700">{errors.firstName}</p>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Last name <span className="text-rose-600">*</span></span>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Ahluwalia"
                        autoComplete="family-name"
                        required
                        aria-invalid={!!errors.lastName}
                        className="app-field w-full text-sm outline-none"
                      />
                      {errors.lastName && <p className="mt-1 text-xs text-rose-700">{errors.lastName}</p>}
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Work email <span className="text-rose-600">*</span></span>
                      <input
                        type="email"
                        value={form.workEmail}
                        onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))}
                        placeholder="priya@agency.co.uk"
                        autoComplete="email"
                        required
                        aria-invalid={!!errors.workEmail}
                        className="app-field w-full text-sm outline-none"
                      />
                      {errors.workEmail && <p className="mt-1 text-xs text-rose-700">{errors.workEmail}</p>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Mobile (optional)</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+44 7…"
                        autoComplete="tel"
                        className="app-field w-full text-sm outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Agency name <span className="text-rose-600">*</span></span>
                      <input
                        type="text"
                        value={form.agency}
                        onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))}
                        placeholder="e.g. Rettie"
                        autoComplete="organization"
                        required
                        aria-invalid={!!errors.agency}
                        className="app-field w-full text-sm outline-none"
                      />
                      {errors.agency && <p className="mt-1 text-xs text-rose-700">{errors.agency}</p>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">Your role <span className="text-rose-600">*</span></span>
                      <select
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                        required
                        aria-invalid={!!errors.role}
                        className="app-field w-full text-sm outline-none"
                      >
                        <option value="">Choose…</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {errors.role && <p className="mt-1 text-xs text-rose-700">{errors.role}</p>}
                    </label>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Managed tenancies <span className="text-rose-600">*</span></span>
                    <Segmented name="Managed tenancies" options={SIZES} value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} error={errors.size} />
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Primary deposit scheme <span className="text-rose-600">*</span></span>
                    <Segmented
                      name="Primary scheme"
                      options={SCHEMES}
                      value={form.scheme}
                      onChange={(v) => setForm((f) => ({ ...f, scheme: v }))}
                      error={errors.scheme}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">What would you like us to show? (optional)</span>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      rows={3}
                      placeholder="For example, how Renovo handles a disputed carpet stain, or how it syncs back to Reapit after a deduction letter goes out..."
                      className="app-field w-full resize-none text-sm outline-none"
                    />
                  </label>

                  <label className="flex items-start gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I would like to receive a calendar invite and a short pre-read. I can unsubscribe at any time.</span>
                  </label>
                  {errors.consent && <p className="text-xs text-rose-700">{errors.consent}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="app-accent-button group inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Book my walkthrough"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Confirmation inside one working day, with three proposed times.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
