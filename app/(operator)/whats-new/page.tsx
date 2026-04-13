import type { Metadata } from 'next'
import { WhatsNewClient } from './whats-new-client'

export const metadata: Metadata = {
  title: "What's New | Renovo AI",
}

export default function WhatsNewPage() {
  return <WhatsNewClient />
}
