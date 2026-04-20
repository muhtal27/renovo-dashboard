import './globals.css'
import './marketing.css'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import {
  defaultDescription,
  ogImagePath,
  siteName,
  siteUrl,
} from '@/lib/marketing-metadata'
import { ClientShell } from './components/ClientShell'

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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Renovo AI',
  },
  icons: {
    icon: [
      { url: '/renovo-ai-icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
        <ClientShell />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'text-sm',
            style: { fontFamily: 'var(--font-dm-sans)' },
          }}
        />
        {children}
      </body>
    </html>
  )
}
