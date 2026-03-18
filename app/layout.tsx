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
  title: 'Annabelle | 24/7 Lettings Operations For Agencies',
  description:
    'Annabelle by Renovo helps letting agencies stay responsive across calls, maintenance, rent, compliance, landlord communication, and tenant updates without losing the operational thread.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Annabelle | 24/7 Lettings Operations For Agencies',
    description:
      'A practical always-on operating layer for letting agencies that need calmer service, clearer records, and stronger workflow continuity.',
    url: siteUrl,
    siteName: 'Annabelle',
    type: 'website',
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
