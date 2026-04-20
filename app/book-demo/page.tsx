import BookDemoClient from '@/app/book-demo/book-demo-client'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Book a demo. Renovo AI',
  description:
    'See Renovo on one of your real checkouts. Thirty minutes, structured, no slide deck. You bring a case, we bring the workspace.',
  path: '/book-demo',
})

export default function BookDemoPage() {
  return (
    <MarketingShell currentPath="/book-demo">
      <BookDemoClient />
    </MarketingShell>
  )
}
