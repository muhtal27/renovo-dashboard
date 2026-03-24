import './globals.css'
import type { Metadata } from 'next'

const defaultSiteUrl = 'https://renovoai.co.uk'
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : defaultSiteUrl)

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: 'Renovo | End-of-Tenancy Automation',
  description:
    'Renovo automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
  openGraph: {
    title: 'Renovo | End-of-Tenancy Automation',
    description:
      'Renovo automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
    url: siteUrl,
    siteName: 'Renovo',
    type: 'website',
    images: [{ url: 'https://renovoai.co.uk/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Renovo | End-of-Tenancy Automation',
    images: ['https://renovoai.co.uk/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
