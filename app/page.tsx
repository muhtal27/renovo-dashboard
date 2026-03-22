import type { Metadata } from 'next'
import HomePageClient from '@/app/home-page-client'

export const metadata: Metadata = {
  title: 'Renovo | End-of-Tenancy Decision Engine',
  description:
    'Evidence in. Claim-ready decisions out. Renovo helps letting agencies review evidence, assess issues, and prepare deposit claim output through a human-reviewed workflow.',
  alternates: {
    canonical: 'https://renovoai.co.uk',
  },
  openGraph: {
    title: 'Renovo | End-of-Tenancy Decision Engine',
    description:
      'Evidence in. Claim-ready decisions out. The specialist EOT workflow for letting agencies.',
    url: 'https://renovoai.co.uk',
    siteName: 'Renovo',
    type: 'website',
    images: [{ url: 'https://renovoai.co.uk/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Renovo | End-of-Tenancy Decision Engine',
    description:
      'Evidence in. Claim-ready decisions out. The specialist EOT workflow for letting agencies.',
    images: ['https://renovoai.co.uk/og-image.png'],
  },
}

export default function HomePage() {
  return <HomePageClient />
}
