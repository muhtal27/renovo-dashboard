import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Instrument_Serif } from 'next/font/google'
import {
  defaultDescription,
  ogImagePath,
  siteName,
  siteUrl,
} from '@/lib/marketing-metadata'

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Renovo AI | End of Tenancy Automation',
  description: defaultDescription,
  applicationName: siteName,
  openGraph: {
    title: 'Renovo AI | End of Tenancy Automation',
    description: defaultDescription,
    url: siteUrl,
    siteName,
    locale: 'en_GB',
    type: 'website',
    images: [{ url: ogImagePath, width: 1200, height: 630, alt: `${siteName} marketing preview` }],
  },
  twitter: {
    title: 'Renovo AI | End of Tenancy Automation',
    description: defaultDescription,
    card: 'summary_large_image',
    images: [ogImagePath],
  },
  robots: {
    index: true,
    follow: true,
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
