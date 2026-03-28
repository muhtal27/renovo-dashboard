import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PublicHome } from '@/app/public-home'
import { readOperatorSessionIfNeeded } from '@/lib/operator-session-server'

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

export default async function HomePage() {
  const operatorSession = await readOperatorSessionIfNeeded()

  if (operatorSession.ok) {
    redirect('/eot')
  }

  return <PublicHome />
}
