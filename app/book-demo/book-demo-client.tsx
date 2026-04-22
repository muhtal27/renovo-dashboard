'use client'

import posthog from 'posthog-js'
import { FormEvent, useState } from 'react'

const BOOKING_URL =
  'https://outlook.office.com/bookwithme/user/df0b78278c634989bd8642429b4df279@renovoai.co.uk/meetingtype/MuagrXaeKESc8zQc19w-MA2?anonymous&ep=mlink'

const ROLES = [
  'Property Manager',
  'Senior / Lead PM',
  'Branch Director',
  'Head of Lettings / Ops',
  'Managing Director / Owner',
  'Investor / Analyst',
  'Other',
] as const

const SIZES = ['Under 200', '200–750', '750–2,500', '2,500+'] as const
const SCHEMES = [
  { label: 'SDS', value: 'SafeDeposits Scotland' },
  { label: 'mydeposits', value: 'mydeposits' },
  { label: 'DPS', value: 'DPS' },
  { label: 'TDS', value: 'TDS' },
] as const

type FormState = {
  first: string
  last: string
  email: string
  phone: string
  company: string
  role: string
  size: string
  scheme: string
  note: string
  consent: boolean
  website: string
}

const INITIAL: FormState = {
  first: '',
  last: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  size: '',
  scheme: '',
  note: '',
  consent: false,
  website: '',
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export default function BookDemoClient() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [submittedName, setSubmittedName] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (
      !form.first.trim() ||
      !form.last.trim() ||
      !isValidEmail(form.email) ||
      !form.company.trim() ||
      !form.role ||
      !form.size ||
      !form.scheme ||
      !form.consent
    ) {
      return
    }

    setSubmitting(true)
    setStatus('idle')

    const fullName = `${form.first.trim()} ${form.last.trim()}`.trim()
    const messageParts = [
      `Role: ${form.role}`,
      `Managed tenancies: ${form.size}`,
      `Primary scheme: ${form.scheme}`,
      form.phone ? `Phone: ${form.phone}` : null,
      form.note ? `\n${form.note}` : null,
    ].filter(Boolean)
    const message = messageParts.join('\n')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          workEmail: form.email.trim(),
          companyName: form.company.trim(),
          enquiryType: 'Product enquiry',
          portfolioSize: '',
          message,
          website: form.website,
          sourcePage: '/book-demo',
        }),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      posthog.capture('book_demo_submitted', {
        role: form.role,
        tenancy_size: form.size,
        primary_scheme: form.scheme,
      })

      setSubmittedName(form.first.trim() || 'there')
      setReference(`BK-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`)
      setForm(INITIAL)
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-hero">
        <p className="kicker">Book a demo</p>
        <h1>
          See Renovo on one of
          <br />
          <span className="accent">your real checkouts.</span>
        </h1>
        <p className="page-hero-sub">
          Send us an anonymised case. We will run it through Renovo live, walk through the reasoning, the draft, and the adjudication bundle, with someone who has managed UK end of tenancy operations on the other end of the call.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-primary btn-lg">
            Pick a time now <span>→</span>
          </a>
          <a href="#book-form" className="btn-outline">
            Or send a written request
          </a>
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          Pick a time now opens our live calendar. You get a confirmation straight away.
        </p>
      </section>

      <section className="section first" id="book-form">
        <div className="book-grid">
          <div>
            <div className="promise">
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">30 minutes, not an hour</div>
                  <div className="promise-d">Tight, structured, no slide deck. You bring a case, we bring the workspace.</div>
                </div>
              </div>
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">On the call, an operator</div>
                  <div className="promise-d">Someone who has signed off deduction letters, not a sales rep reading a script.</div>
                </div>
              </div>
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">Anonymise before you send</div>
                  <div className="promise-d">
                    Strip tenant personal data, or we will redact it before we touch it. DPA available on request.
                  </div>
                </div>
              </div>
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">No commitment after the call</div>
                  <div className="promise-d">If it does not fit, we will say so. If it does, Free covers let only portfolios immediately.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-head">
              <span className="form-title">Request a walkthrough</span>
              <span className="form-live">Responds in &lt; 1 business day</span>
            </div>

            {status === 'success' ? (
              <div className="success" role="status" aria-live="polite">
                <div className="success-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>Request received</h3>
                <p>
                  Thanks, <span>{submittedName}</span>. We will be in touch inside one working day with three proposed times.
                </p>
                <p style={{ fontFamily: 'var(--mk-font-mono)', fontSize: 11, color: 'var(--em-400)', marginTop: 16 }}>
                  REQ-<span>{reference}</span>
                </p>
              </div>
            ) : (
              <form className="form-body" onSubmit={handleSubmit} noValidate>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  style={{ display: 'none' }}
                />

                {status === 'error' && (
                  <div
                    role="alert"
                    style={{
                      border: '1px solid rgba(244,63,94,.3)',
                      background: 'rgba(244,63,94,.1)',
                      color: 'var(--rose-300)',
                      padding: '12px 14px',
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  >
                    Something went wrong. Please try again or email{' '}
                    <a style={{ textDecoration: 'underline' }} href="mailto:hello@renovoai.co.uk">
                      hello@renovoai.co.uk
                    </a>
                    .
                  </div>
                )}

                <div className="field-row">
                  <div className="field">
                    <label>
                      First name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.first}
                      onChange={(e) => setForm((f) => ({ ...f, first: e.target.value }))}
                      required
                      placeholder="Priya"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="field">
                    <label>
                      Last name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.last}
                      onChange={(e) => setForm((f) => ({ ...f, last: e.target.value }))}
                      required
                      placeholder="Ahluwalia"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      Work email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      placeholder="priya@agency.co.uk"
                      autoComplete="email"
                    />
                  </div>
                  <div className="field">
                    <label>Mobile (optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+44 7…"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      Agency name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                      required
                      placeholder="e.g. Rettie"
                      autoComplete="organization"
                    />
                  </div>
                  <div className="field">
                    <label>
                      Your role <span className="req">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      required
                    >
                      <option value="">Choose…</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>
                    Managed tenancies <span className="req">*</span>
                  </label>
                  <div className="seg">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={form.size === s ? 'active' : ''}
                        onClick={() => setForm((f) => ({ ...f, size: s }))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>
                    Primary deposit scheme <span className="req">*</span>
                  </label>
                  <div className="seg">
                    {SCHEMES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={form.scheme === s.value ? 'active' : ''}
                        onClick={() => setForm((f) => ({ ...f, scheme: s.value }))}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>What would you like us to show? (optional)</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="For example, how Renovo handles a disputed carpet stain, or how it syncs back to your CRM after a deduction letter goes out..."
                  />
                </div>

                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    required
                  />
                  <span className="check-text">
                    I would like to receive a calendar invite and a short pre read. I can unsubscribe at any time.
                  </span>
                </label>
                <button className="submit-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Book my walkthrough'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <p className="form-fine">Confirmation inside one working day, with three proposed times.</p>
              </form>
            )}
          </div>
        </div>
      </section>

    </>
  )
}
