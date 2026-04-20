import HomePageClient from "@/app/home-page-client"
import { MarketingShell } from "@/app/components/MarketingShell"
import {
  createMarketingMetadata,
  createOrganizationJsonLd,
  createWebPageJsonLd,
  createWebsiteJsonLd,
  serializeJsonLd,
} from "@/lib/marketing-metadata"

const title = "Renovo AI. End of tenancy, resolved."
const description =
  "Enterprise software for end of tenancy operations. AI drafts, managers decide, every decision is audit ready for UK scheme adjudication."

export const metadata = createMarketingMetadata({
  title,
  description,
  path: "/",
})

export default function HomePage() {
  return (
    <MarketingShell currentPath="/">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createOrganizationJsonLd(),
            createWebsiteJsonLd(),
            createWebPageJsonLd({
              path: "/",
              title,
              description,
            }),
          ]),
        }}
      />
      <HomePageClient />
    </MarketingShell>
  )
}
