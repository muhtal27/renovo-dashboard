import type { Metadata } from 'next'
import PricingPageClient from '@/app/pricing/pricing-page-client'

export const metadata: Metadata = {
  title: 'Pricing | Renovo',
  description:
    'Simple pricing for letting agencies using Renovo to prepare end-of-tenancy deposit claims.',
  alternates: {
    canonical: 'https://renovoai.co.uk/pricing',
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
