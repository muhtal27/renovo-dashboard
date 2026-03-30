import PricingPageClient, { pricingFaqs } from '@/app/pricing/pricing-page-client'
import {
  createFaqPageJsonLd,
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Pricing | Renovo AI'
const description =
  'Simple pricing for letting agencies using Renovo AI to prepare end-of-tenancy deposit claims.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/pricing',
              title,
              description,
            }),
            createFaqPageJsonLd(pricingFaqs),
          ]),
        }}
      />
      <PricingPageClient />
    </>
  )
}
