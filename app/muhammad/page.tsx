import type { Metadata } from 'next'
import { createMarketingMetadata } from '@/lib/marketing-metadata'
import ContactCard from './contact-card'

export const metadata: Metadata = createMarketingMetadata({
  title: 'Muhammad Munawar — Renovo AI',
  description:
    'Muhammad Munawar, Founder & CEO at Renovo AI. Tap Save to add me to your contacts. Software for UK letting agencies — end of tenancy, resolved.',
  path: '/muhammad',
})

export default function MuhammadContactPage() {
  return <ContactCard />
}
