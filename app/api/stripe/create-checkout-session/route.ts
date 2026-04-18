import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { captureServerEvent, EVENTS } from '@/lib/analytics-server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export async function POST() {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    })

    await captureServerEvent({
      event: EVENTS.CHECKOUT_SESSION_CREATED,
      properties: { plan: 'portfolio_365', stripe_session_id: session.id },
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
