import type { Metadata } from 'next'
import HomePageClient from '@/app/home-page-client'

export const metadata: Metadata = {
  title: 'Renovo AI | End-of-Tenancy Automation',
  description:
    'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
  alternates: {
    canonical: 'https://renovoai.co.uk/',
  },
  openGraph: {
    title: 'Renovo AI | End-of-Tenancy Automation',
    description:
      'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
    url: 'https://renovoai.co.uk/',
    siteName: 'Renovo AI',
    type: 'website',
    images: [{ url: 'https://renovoai.co.uk/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Renovo AI | End-of-Tenancy Automation',
    description:
      'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
    images: ['https://renovoai.co.uk/og-image.png'],
  },
}

export default function HomePage() {
  return <HomePageClient />
}
