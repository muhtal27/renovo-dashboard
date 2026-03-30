import ComplianceClient from "@/app/compliance/compliance-client"
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from "@/lib/marketing-metadata"

const title = "Compliance | Renovo AI"
const description =
  "Overview of Renovo AI compliance, privacy, hosting, access control, audit trail, and information handling practices."

export const metadata = createMarketingMetadata({
  title,
  description,
  path: "/compliance",
})

export default function CompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: "/compliance",
              title,
              description,
            }),
          ]),
        }}
      />
      <ComplianceClient />
    </>
  )
}
