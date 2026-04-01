import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/marketing-metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/claims',
          '/disputes',
          '/eot',
          '/evidence',
          '/issues',
          '/knowledge',
          '/login',
          '/overview',
          '/reports',
          '/reset-password',
          '/settings',
          '/tenancy',
          '/workspace-access',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
