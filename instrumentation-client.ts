import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { redactSentryEvent } from '@/lib/sentry-redact'

const isProd = process.env.NODE_ENV === 'production'

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null
  } catch {
    return null
  }
})()

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    'https://a612e2487170f72afced68559c6f67d9@o4511214422458368.ingest.de.sentry.io/4511218913312848',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  integrations: [Sentry.browserTracingIntegration(), Sentry.browserProfilingIntegration()],
  tracesSampleRate: isProd ? 0.1 : 1.0,
  tracePropagationTargets: [
    'localhost',
    /^\//,
    /^https:\/\/api\.renovoai\.co\.uk\//,
    ...(supabaseHost ? [new RegExp(`^https://${supabaseHost.replace(/\./g, '\\.')}/`)] : []),
  ],
  profileSessionSampleRate: isProd ? 0.1 : 1.0,
  sendDefaultPii: false,
  beforeSend: redactSentryEvent,
  beforeSendTransaction: redactSentryEvent,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: '/ingest',
  ui_host: 'https://eu.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: false,
  debug: process.env.NODE_ENV === 'development',
})
