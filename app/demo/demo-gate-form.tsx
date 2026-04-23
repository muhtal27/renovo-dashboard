'use client'

import { FormEvent, useEffect, useState } from 'react'

type FormState = {
  firstName: string
  email: string
  company: string
  consent: boolean
  website: string
}

const INITIAL: FormState = {
  firstName: '',
  email: '',
  company: '',
  consent: false,
  website: '',
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function readUtmParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
  }
}

export default function DemoGateForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [utm, setUtm] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    setUtm(readUtmParams())
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const email = form.email.trim()
    if (!isValidEmail(email) || !form.consent) return

    setSubmitting(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/demo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: form.firstName.trim() || undefined,
          company: form.company.trim() || undefined,
          sourcePage: '/demo',
          website: form.website,
          ...utm,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setErrorMessage(body?.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      // Server has set the access cookie — reload so the page renders the iframe.
      window.location.replace('/demo')
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-hero">
        <p className="kicker">Interactive demo</p>
        <h1>
          See Renovo the way
          <br />
          <span className="accent">your team would use it.</span>
        </h1>
        <p className="page-hero-sub">
          A real operator workspace, not a video. Click through a checkout, a deposit claim, and a tenant dispute — at your own pace. Drop your work email to launch it.
        </p>
      </section>

      <section className="section first" id="demo-gate">
        <div className="book-grid">
          <div>
            <div className="promise">
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">Ten minutes, fully clickable</div>
                  <div className="promise-d">Real UI, real data, real reasoning — no sales scripts.</div>
                </div>
              </div>
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">We only need a work email</div>
                  <div className="promise-d">No passwords, no calendar dance. You can book a live walkthrough after if you want one.</div>
                </div>
              </div>
              <div className="promise-item">
                <span className="promise-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <div className="promise-t">Access for 30 days</div>
                  <div className="promise-d">Come back any time — no re-entry, no cookie wall every session.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-head">
              <span className="form-title">Launch the interactive demo</span>
              <span className="form-live">Instant access</span>
            </div>

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
                  {errorMessage}
                </div>
              )}

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

              <div className="field-row">
                <div className="field">
                  <label>First name (optional)</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Priya"
                    autoComplete="given-name"
                  />
                </div>
                <div className="field">
                  <label>Agency (optional)</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. Rettie"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  required
                />
                <span className="check-text">
                  I&rsquo;m OK with Renovo contacting me about this demo. I can unsubscribe any time.
                </span>
              </label>

              <button className="submit-btn" type="submit" disabled={submitting}>
                {submitting ? 'Launching…' : 'Launch interactive demo'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <p className="form-fine">Your email is only used for demo access and follow-up. See our privacy policy.</p>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
