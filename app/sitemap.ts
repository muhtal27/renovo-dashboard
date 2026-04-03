import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/marketing-metadata'

const marketingRoutes: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/demo', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/book-demo', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/compliance', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/investors', changeFrequency: 'monthly', priority: 0.55 },
  { path: '/security', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/careers', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/complaints', changeFrequency: 'yearly', priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return marketingRoutes.map((route) => ({
    url: route.path === '/' ? siteUrl : `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
