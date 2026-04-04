import InsightsClient from "@/app/insights/insights-client"
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Insights | Renovo AI'
const description =
  'Market research, product updates, and industry analysis for UK property managers and letting agencies.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/insights',
})

export default function InsightsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/insights',
              title,
              description,
            }),
          ]),
        }}
      />
      <InsightsClient />
    </>
  )
}
