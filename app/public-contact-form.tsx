'use client'

import { FormEvent, useState } from 'react'

type EnquiryType = 'Early access' | 'Partnerships' | 'Investor enquiry' | 'General enquiry'
type PortfolioSize =
  | 'Solo / independent'
  | '1-100 properties'
  | '100-500 properties'
  | '500+ properties'
  | ''

type FormState = {
  fullName: string
  workEmail: string
  companyName: string
  enquiryType: '' | EnquiryType
  portfolioSize: PortfolioSize
  message: string
  website: string
}

const INITIAL_FORM_STATE: FormState = {
  fullName: '',
  workEmail: '',
  companyName: '',
  enquiryType: '',
  portfolioSize: '',
  message: '',
  website: '',
}

const ENQUIRY_OPTIONS: EnquiryType[] = [
  'Early access',
  'Partnerships',
  'Investor enquiry',
  'General enquiry',
]

const PORTFOLIO_OPTIONS: Exclude<PortfolioSize, ''>[] = [
  'Solo / independent',
  '1-100 properties',
  '100-500 properties',
  '500+ properties',
]

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function PublicContactForm({
  sourcePage = '/contact',
}: {
  sourcePage?: string
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      fullName: form.fullName.trim(),
      workEmail: form.workEmail.trim(),
      companyName: form.companyName.trim(),
      enquiryType: form.enquiryType,
      portfolioSize: form.portfolioSize || null,
      message: form.message.trim(),
      website: form.website.trim(),
      sourcePage,
    }

    if (!payload.fullName) {
      setFieldError('Enter your full name.')
      return
    }

    if (!payload.workEmail || !isValidEmail(payload.workEmail)) {
      setFieldError('Enter a valid work email address.')
      return
    }

    if (!payload.enquiryType) {
      setFieldError('Choose an enquiry type.')
      return
    }

    if (!payload.message) {
      setFieldError('Add a message so we know how to help.')
      return
    }

    setSubmitting(true)
    setFieldError(null)
    setStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      setForm(INITIAL_FORM_STATE)
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/92 p-5 shadow-[0_16px_36px_rgba(55,43,27,0.08)]">
      <p className="app-kicker">Contact form</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        Send us a message
      </h2>

      {status === 'success' ? (
        <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-6 text-center text-emerald-950">
          <p className="text-2xl font-semibold">✓</p>
          <p className="mt-3 text-lg font-semibold">Message received</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/85">
            Thanks for getting in touch. We&apos;ll reply as soon as we can.
          </p>
        </div>
      ) : (
        <>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={(event) =>
                setForm((current) => ({ ...current, website: event.target.value }))
              }
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Full name <span className="text-stone-500">(required)</span>
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Jane Smith"
                  className="app-field text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Work email <span className="text-stone-500">(required)</span>
                </span>
                <input
                  type="email"
                  value={form.workEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, workEmail: event.target.value }))
                  }
                  placeholder="jane@agency.co.uk"
                  className="app-field text-sm outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Company / agency name <span className="text-stone-500">(optional)</span>
                </span>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, companyName: event.target.value }))
                  }
                  placeholder="North Street Lettings"
                  className="app-field text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Enquiry type <span className="text-stone-500">(required)</span>
                </span>
                <select
                  value={form.enquiryType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      enquiryType: event.target.value as FormState['enquiryType'],
                    }))
                  }
                  className="app-field text-sm outline-none"
                >
                  <option value="">Select an enquiry type</option>
                  {ENQUIRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Portfolio size <span className="text-stone-500">(optional)</span>
              </span>
              <select
                value={form.portfolioSize}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    portfolioSize: event.target.value as PortfolioSize,
                  }))
                }
                className="app-field text-sm outline-none"
              >
                <option value="">Select portfolio size</option>
                {PORTFOLIO_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/-/g, '–')}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Message <span className="text-stone-500">(required)</span>
              </span>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                rows={7}
                placeholder="Tell us a little about what you need."
                className="app-field min-h-[180px] text-sm outline-none"
              />
            </label>

            {fieldError ? (
              <div className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {fieldError}
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Something went wrong. Please try again or email hello@renovoai.co.uk.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="app-primary-button w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </form>

          <p className="mt-4 text-xs leading-6 text-stone-500">
            We only use these details to respond to your enquiry.
          </p>
        </>
      )}
    </section>
  )
}
