import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Instrument_Serif } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
})

const defaultSiteUrl = 'https://renovoai.co.uk'
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : defaultSiteUrl)

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: 'Renovo AI | End-of-Tenancy Automation',
  description:
    'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
  openGraph: {
    title: 'Renovo AI | End-of-Tenancy Automation',
    description:
      'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.',
    url: siteUrl,
    siteName: 'Renovo AI',
    type: 'website',
    images: [{ url: 'https://renovoai.co.uk/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Renovo AI | End-of-Tenancy Automation',
    images: ['https://renovoai.co.uk/og-image.png'],
  },
  icons: {
    icon: '/logo-new.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSerif.variable}`}>{children}</body>
    </html>
  )
}
