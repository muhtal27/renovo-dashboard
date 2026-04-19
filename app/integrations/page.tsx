import IntegrationsClient from '@/app/integrations/integrations-client'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Integrations | Renovo AI'
const description =
  'Every UK deposit scheme and the CRM, inventory, accounting, and signature tools UK letting agencies already run. Connectors, webhooks, and a public REST API.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/integrations',
})

export default function IntegrationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/integrations',
              title,
              description,
            }),
          ]),
        }}
      />
      <IntegrationsClient />
    </>
  )
}
