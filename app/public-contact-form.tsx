'use client'

import { FormEvent, useId, useState } from 'react'
import posthog from 'posthog-js'

type EnquiryType = 'Product enquiry' | 'Partnerships' | 'Investor enquiry' | 'General enquiry'
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

type FieldName = 'fullName' | 'workEmail' | 'enquiryType' | 'message'
type FieldErrors = Partial<Record<FieldName, string>>

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
  'Product enquiry',
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

function getDescribedBy(...ids: Array<string | undefined | false>) {
  const value = ids.filter(Boolean).join(' ')
  return value.length > 0 ? value : undefined
}

export function PublicContactForm({
  sourcePage = '/contact',
}: {
  sourcePage?: string
}) {
  const baseId = useId()
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const fullNameErrorId = `${baseId}-full-name-error`
  const workEmailErrorId = `${baseId}-work-email-error`
  const enquiryTypeErrorId = `${baseId}-enquiry-type-error`
  const messageErrorId = `${baseId}-message-error`
  const formErrorId = `${baseId}-form-error`
  const formStatusId = `${baseId}-form-status`
  const privacyHintId = `${baseId}-privacy-hint`

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

    const nextErrors: FieldErrors = {}

    if (!payload.fullName) {
      nextErrors.fullName = 'Enter your full name.'
    }

    if (!payload.workEmail || !isValidEmail(payload.workEmail)) {
      nextErrors.workEmail = 'Enter a valid work email address.'
    }

    if (!payload.enquiryType) {
      nextErrors.enquiryType = 'Choose an enquiry type.'
    }

    if (!payload.message) {
      nextErrors.message = 'Add a message so we know how to help.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setStatus('idle')
      return
    }

    setSubmitting(true)
    setFieldErrors({})
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

      posthog.capture('contact_form_submitted', {
        enquiry_type: payload.enquiryType,
        portfolio_size: payload.portfolioSize,
        source_page: sourcePage,
      })
      setForm(INITIAL_FORM_STATE)
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <p className="app-kicker">Contact form</p>
      <h2 className="mt-3 text-2xl tracking-tight text-zinc-950">Send us a message</h2>

      {status === 'success' ? (
        <div
          id={formStatusId}
          role="status"
          aria-live="polite"
          className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-6 text-center text-zinc-900"
        >
          <p className="text-2xl">✓</p>
          <p className="mt-3 text-lg">Message received</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Thanks for getting in touch. We&apos;ll reply as soon as we can.
          </p>
        </div>
      ) : (
        <>
          <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
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

            {Object.keys(fieldErrors).length > 0 ? (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                Check the highlighted fields and try again.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  Full name <span className="text-zinc-500">(required)</span>
                </span>
                <input
                  id={`${baseId}-full-name`}
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Jane Smith"
                  autoComplete="name"
                  required
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                  aria-describedby={getDescribedBy(formErrorId, fieldErrors.fullName && fullNameErrorId)}
                  className="app-field text-sm outline-none"
                />
                {fieldErrors.fullName ? (
                  <p id={fullNameErrorId} className="mt-2 text-sm text-rose-700">
                    {fieldErrors.fullName}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  Work email <span className="text-zinc-500">(required)</span>
                </span>
                <input
                  id={`${baseId}-work-email`}
                  type="email"
                  name="workEmail"
                  value={form.workEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, workEmail: event.target.value }))
                  }
                  placeholder="jane@agency.co.uk"
                  autoComplete="email"
                  required
                  aria-invalid={fieldErrors.workEmail ? true : undefined}
                  aria-describedby={getDescribedBy(formErrorId, fieldErrors.workEmail && workEmailErrorId)}
                  className="app-field text-sm outline-none"
                />
                {fieldErrors.workEmail ? (
                  <p id={workEmailErrorId} className="mt-2 text-sm text-rose-700">
                    {fieldErrors.workEmail}
                  </p>
                ) : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  Company / agency name <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  id={`${baseId}-company-name`}
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, companyName: event.target.value }))
                  }
                  placeholder="North Street Lettings"
                  autoComplete="organization"
                  className="app-field text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  Enquiry type <span className="text-zinc-500">(required)</span>
                </span>
                <select
                  id={`${baseId}-enquiry-type`}
                  name="enquiryType"
                  value={form.enquiryType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      enquiryType: event.target.value as FormState['enquiryType'],
                    }))
                  }
                  required
                  aria-invalid={fieldErrors.enquiryType ? true : undefined}
                  aria-describedby={getDescribedBy(formErrorId, fieldErrors.enquiryType && enquiryTypeErrorId)}
                  className="app-field text-sm outline-none"
                >
                  <option value="">Select an enquiry type</option>
                  {ENQUIRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {fieldErrors.enquiryType ? (
                  <p id={enquiryTypeErrorId} className="mt-2 text-sm text-rose-700">
                    {fieldErrors.enquiryType}
                  </p>
                ) : null}
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Portfolio size <span className="text-zinc-500">(optional)</span>
              </span>
              <select
                id={`${baseId}-portfolio-size`}
                name="portfolioSize"
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
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Message <span className="text-zinc-500">(required)</span>
              </span>
              <textarea
                id={`${baseId}-message`}
                name="message"
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                rows={7}
                placeholder="Tell us a little about what you need."
                autoComplete="off"
                required
                aria-invalid={fieldErrors.message ? true : undefined}
                aria-describedby={getDescribedBy(
                  formErrorId,
                  fieldErrors.message && messageErrorId,
                  privacyHintId
                )}
                className="app-field app-textarea min-h-[180px] text-sm outline-none"
              />
              {fieldErrors.message ? (
                <p id={messageErrorId} className="mt-2 text-sm text-rose-700">
                  {fieldErrors.message}
                </p>
              ) : null}
            </label>

            {status === 'error' ? (
              <div
                id={formStatusId}
                role="alert"
                aria-live="assertive"
                className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
              >
                Something went wrong. Please try again or email hello@renovoai.co.uk.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="app-primary-button w-full rounded px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </form>

          <p
            id={privacyHintId}
            className="mt-4 border-t border-zinc-200 pt-4 text-xs leading-6 text-zinc-500"
          >
            We only use these details to respond to your enquiry. See our{' '}
            <a href="/privacy" className="underline decoration-zinc-300 underline-offset-4">
              privacy notice
            </a>
            .
          </p>
        </>
      )}
    </section>
  )
}
