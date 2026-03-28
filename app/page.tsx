import { PublicHome } from '@/app/public-home'
import {
  createMarketingMetadata,
  createOrganizationJsonLd,
  createWebPageJsonLd,
  createWebsiteJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Renovo AI | End-of-Tenancy Automation'
const description =
  'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/',
})

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createOrganizationJsonLd(),
            createWebsiteJsonLd(),
            createWebPageJsonLd({
              path: '/',
              title,
              description,
            }),
          ]),
        }}
      />
      <PublicHome />
    </>
  )
}
