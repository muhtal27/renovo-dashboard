import BookDemoClient from "@/app/book-demo/book-demo-client"
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from "@/lib/marketing-metadata"

const title = "Book a Demo | Renovo AI"
const description =
  "Book a live walkthrough of Renovo AI on one of your real checkouts. Thirty minutes with an operator who has managed UK end of tenancy, not a scripted sales call."

export const metadata = createMarketingMetadata({
  title,
  description,
  path: "/book-demo",
})

export default function BookDemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: "/book-demo",
              title,
              description,
            }),
          ]),
        }}
      />
      <BookDemoClient />
    </>
  )
}
