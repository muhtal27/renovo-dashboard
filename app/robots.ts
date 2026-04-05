import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/marketing-metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/tenancies',
          '/deposit-scheme',
          '/disputes',
          '/guidance',
          '/login',
          '/reports',
          '/settings',
          '/teams',
          '/tenancy',
          '/inventory-feedback',
          '/workspace-access',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
