import AboutClient from "@/app/about/about-client"
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'About | Renovo AI'
const description =
  'Corporate overview of Renovo AI, the company focus, operating principles, and product approach for UK letting agencies.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/about',
})

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/about',
              title,
              description,
            }),
          ]),
        }}
      />
      <AboutClient />
    </>
  )
}
