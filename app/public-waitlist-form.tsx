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
    <section className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <p className="app-kicker">Request access</p>
      <h3 className="mt-3 text-2xl tracking-tight text-[#0f0e0d]">
        Leave your details
      </h3>

      {submitted ? (
        <div className="mt-5 rounded-xl border border-[#b9e3d7] bg-[#e1f5ee] px-5 py-6 text-center text-[#0c5946]">
          <p className="text-2xl">✓</p>
          <p className="mt-3 text-lg">You&apos;re on the list</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/85">
            We&apos;ll be in touch when rollout capacity opens for your agency.
          </p>
        </div>
      ) : (
        <>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Jane Smith"
                className="app-field text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Work email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="jane@agency.co.uk"
                className="app-field text-sm outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Agency name</span>
              <input
                type="text"
                value={form.agency}
                onChange={(event) => setForm((current) => ({ ...current, agency: event.target.value }))}
                placeholder="North Street Lettings"
                className="app-field text-sm outline-none"
              />
            </label>

            {status === 'error' ? (
              <div className="rounded-lg border border-[#efc7c7] bg-[#fcebeb] px-4 py-3 text-sm text-[#8d2e2e]">
                Something went wrong - please try again.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="app-primary-button w-full rounded px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Join the rollout list'}
            </button>
          </form>

          <p className="mt-4 text-xs leading-6 text-[#7a7670]">
            We only use these details to contact you about Renovo AI rollout access.
          </p>
        </>
      )}
    </section>
  )
}
