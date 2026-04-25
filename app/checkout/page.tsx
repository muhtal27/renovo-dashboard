'use client'

import { useCallback, useEffect } from 'react'
import posthog from 'posthog-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import Link from 'next/link'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
)

export default function CheckoutPage() {
  useEffect(() => {
    posthog.capture('checkout_started', { plan: 'portfolio_365' })
  }, [])

  const fetchClientSecret = useCallback(() => {
    return fetch('/api/stripe/create-checkout-session', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => data.clientSecret)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <Link
          href="/#/pricing"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-zinc-950"
        >
          ← Back to pricing
        </Link>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-950">
          Subscribe to Portfolio 365
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Complete your subscription below. You can cancel anytime.
        </p>

        <div className="rounded-lg border border-zinc-200 bg-white p-1">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
