import HowItWorksClient from "@/app/how-it-works/how-it-works-client"
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from "@/lib/marketing-metadata"

const title = "How It Works | Renovo AI"
const description =
  "See how Renovo AI moves a checkout from evidence intake to liability assessment, landlord review, deposit release, and dispute pack generation."

export const metadata = createMarketingMetadata({
  title,
  description,
  path: "/how-it-works",
})

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: "/how-it-works",
              title,
              description,
            }),
          ]),
        }}
      />
      <HowItWorksClient />
    </>
  )
}
