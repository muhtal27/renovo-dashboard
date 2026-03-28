import type { Metadata } from 'next'

export const siteName = 'Renovo AI'
export const legalName = 'Renovo AI Ltd'
export const defaultSiteUrl = 'https://renovoai.co.uk'
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : defaultSiteUrl)
export const defaultDescription =
  'Renovo AI automates end-of-tenancy work for UK property managers and letting agencies, from evidence review and issue assessment to claim-ready output.'
export const ogImagePath = '/og-image.jpg'

const organizationId = `${siteUrl}#organization`
const websiteId = `${siteUrl}#website`

type MarketingMetadataOptions = {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

function canonicalPath(path: string) {
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}

export function createMarketingMetadata({
  title,
  description,
  path,
  noIndex = false,
}: MarketingMetadataOptions): Metadata {
  const canonical = canonicalPath(path)

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      locale: 'en_GB',
      type: 'website',
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${siteName} marketing preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImagePath],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  }
}

export function createOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: siteName,
    legalName,
    url: siteUrl,
    email: 'hello@renovoai.co.uk',
    vatID: 'GB483379648',
    identifier: 'SC833544',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Edinburgh',
      addressCountry: 'GB',
    },
  }
}

export function createWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: siteName,
    publisher: {
      '@id': organizationId,
    },
  }
}

export function createContactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${siteUrl}/contact`,
    name: 'Contact Renovo AI',
  }
}

export function createFaqPageJsonLd(
  faqs: ReadonlyArray<{
    q: string
    a: string
  }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

export function createWebPageJsonLd({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: `${siteUrl}${canonicalPath(path) === '/' ? '' : canonicalPath(path)}`,
    name: title,
    description,
    isPartOf: {
      '@id': websiteId,
    },
  }
}

export function serializeJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
