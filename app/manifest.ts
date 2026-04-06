import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Renovo AI',
    short_name: 'Renovo',
    description: 'End of Tenancy Automation — deposit disputes, reports & compliance.',
    start_url: '/tenancies',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/renovo-ai-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Tenancies',
        short_name: 'Tenancies',
        url: '/tenancies',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Disputes',
        short_name: 'Disputes',
        url: '/disputes',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Deposit Scheme',
        short_name: 'Deposits',
        url: '/deposit-scheme',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [
      {
        src: '/og-image.jpg',
        sizes: '1200x630',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'Renovo AI dashboard',
      },
    ],
  }
}
