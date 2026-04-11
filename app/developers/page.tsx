import type { Metadata } from 'next'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'
import { DevelopersPageClient } from './developers-page-client'

export const metadata: Metadata = createMarketingMetadata({
  title: 'API Documentation | Renovo AI',
  description:
    'Integrate with Renovo AI using our public REST API. Push inspections, read cases, download documents, and receive real-time webhooks.',
  path: '/developers',
})

export default function DevelopersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            createWebPageJsonLd({
              path: '/developers',
              title: 'API Documentation | Renovo AI',
              description:
                'Public REST API documentation for property management partners integrating with Renovo AI.',
            })
          ),
        }}
      />
      <DevelopersPageClient />
    </>
  )
}
