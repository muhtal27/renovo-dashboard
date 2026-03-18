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
  title: 'Renovo AI | Lettings Operations Platform',
  description:
    'Renovo AI unifies operator workflows, landlord visibility, tenant communication, and contractor coordination in one lettings operations platform.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Renovo AI | Lettings Operations Platform',
    description:
      'A practical operating system for residential lettings teams handling communication, maintenance, rent, and reporting in one place.',
    url: siteUrl,
    siteName: 'Renovo AI',
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
