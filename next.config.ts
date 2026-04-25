import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob:${process.env.NODE_ENV === 'development' ? ' https://images.unsplash.com' : ''}`,
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.renovoai.co.uk https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
      "base-uri 'self'",
      "form-action 'self' https://*.supabase.co https://api.renovoai.co.uk https://login.microsoftonline.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

// The interactive demo lives in an iframe at /demo/content. It needs to be
// framable by /demo (same origin) and loads Google Fonts CSS directly from
// its inline <link>, so style-src must allow fonts.googleapis.com.
const demoContentSecurityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'geolocation=()',
      'microphone=()',
      'payment=()',
    ].join(', '),
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  async redirects() {
    // The dashboard app now lives on app.renovoai.co.uk while the marketing
    // website is a separate static Vercel project. Keep dashboard root from
    // relying on the old public/website.html snapshot.
    const dashboardRedirects = [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]

    // Keep old marketing deep links from 404'ing if they hit the dashboard
    // project; send them to the standalone public website.
    const hashRoutes = [
      'about',
      'careers',
      'changelog',
      'complaints',
      'compliance',
      'contact',
      'developers',
      'how-it-works',
      'insights',
      'integrations',
      'investors',
      'pricing',
      'privacy',
      'security',
      'status',
      'terms',
    ]
    return dashboardRedirects.concat(hashRoutes.map((route) => ({
      source: `/${route}`,
      destination: `https://renovoai.co.uk/#/${route}`,
      permanent: false,
    })))
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', '@tanstack/react-query'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Document-Policy', value: 'js-profiling' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Must come after /:path* — later matching rules win when the same
      // header key is set, so this overrides the global frame-ancestors.
      {
        source: '/demo/content',
        headers: demoContentSecurityHeaders,
      },
    ]
  },
};

const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    automaticVercelMonitors: false,
    treeshake: { removeDebugLogging: true },
  },
  ...(release ? { release: { name: release } } : {}),
});
