'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import Link from 'next/link'

export default function CheckoutCompletePage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const capturedRef = useRef(false)

  useEffect(() => {
    if (!sessionId) return

    fetch(`/api/stripe/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status)
        setEmail(data.customer_email)
        if (!capturedRef.current) {
          capturedRef.current = true
          if (data.status === 'complete') {
            posthog.capture('subscription_completed', {
              plan: 'portfolio_365',
              customer_email: data.customer_email,
              stripe_session_id: sessionId,
            })
          }
        }
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  const isSuccess = status === 'complete'

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="mx-auto max-w-[480px] rounded-lg border border-zinc-200 bg-white p-10 text-center">
        <div
          className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
            isSuccess ? 'bg-emerald-100' : 'bg-red-100'
          }`}
        >
          {isSuccess ? (
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-950">
          {isSuccess ? 'Subscription confirmed' : 'Something went wrong'}
        </h1>

        <p className="mb-8 text-sm leading-7 text-slate-500">
          {isSuccess
            ? `Thank you for subscribing to Portfolio 365. A confirmation has been sent to ${email ?? 'your email'}.`
            : 'Your payment could not be processed. Please try again or contact support.'}
        </p>

        <div className="flex flex-col gap-3">
          {isSuccess ? (
            <Link
              href="/"
              className="app-primary-button inline-block rounded-md px-6 py-3 text-center text-sm font-medium"
            >
              Go to dashboard →
            </Link>
          ) : (
            <Link
              href="/checkout"
              className="app-primary-button inline-block rounded-md px-6 py-3 text-center text-sm font-medium"
            >
              Try again →
            </Link>
          )}
          <Link
            href="/#/pricing"
            className="text-sm font-medium text-slate-500 hover:text-zinc-950"
          >
            Back to pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
