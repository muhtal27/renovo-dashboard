'use client'

import { FormEvent, useState } from 'react'

type FormState = {
  name: string
  email: string
  agency: string
}

const INITIAL_FORM_STATE: FormState = {
  name: '',
  email: '',
  agency: '',
}

export function PublicWaitlistForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSubmitting(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          agency: form.agency.trim(),
        }),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      setStatus('success')
      setSubmitted(true)
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/92 p-5 shadow-[0_16px_36px_rgba(55,43,27,0.08)]">
      <p className="app-kicker">Request access</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        Leave your details
      </h3>

      {submitted ? (
        <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-6 text-center text-emerald-950">
          <p className="text-2xl font-semibold">✓</p>
          <p className="mt-3 text-lg font-semibold">You&apos;re on the list</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/85">
            We&apos;ll be in touch when rollout capacity opens for your agency.
          </p>
        </div>
      ) : (
        <>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Jane Smith"
                className="app-field text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Work email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="jane@agency.co.uk"
                className="app-field text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Agency name</span>
              <input
                type="text"
                value={form.agency}
                onChange={(event) => setForm((current) => ({ ...current, agency: event.target.value }))}
                placeholder="North Street Lettings"
                className="app-field text-sm outline-none"
              />
            </label>

            {status === 'error' ? (
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Something went wrong — please try again.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="app-primary-button w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Join the rollout list'}
            </button>
          </form>

          <p className="mt-4 text-xs leading-6 text-stone-500">
            We only use these details to contact you about Renovo rollout access.
          </p>
        </>
      )}
    </section>
  )
}
