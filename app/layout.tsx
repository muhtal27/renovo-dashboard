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
  title: 'Renovo | End-of-Tenancy Decision Engine',
  description:
    'Renovo helps letting agencies review evidence, assess issues, draft decisions, and prepare claim output through a human-reviewed end-of-tenancy workflow.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Renovo | End-of-Tenancy Decision Engine',
    description:
      'Evidence in. Claim-ready decisions out. The specialist EOT workflow for letting agencies.',
    url: siteUrl,
    siteName: 'Renovo',
    type: 'website',
  },
  twitter: {
    title: 'Renovo | End-of-Tenancy Decision Engine',
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
