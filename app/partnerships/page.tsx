import { redirect } from 'next/navigation'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Partnerships | Renovo AI',
  description: 'Renovo AI partnership discussions.',
  path: '/partnerships',
  noIndex: true,
})

export default function PartnershipsPage() {
  redirect('/contact')
}
