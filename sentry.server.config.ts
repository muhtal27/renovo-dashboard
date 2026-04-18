import * as Sentry from '@sentry/nextjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { redactSentryEvent } from '@/lib/sentry-redact'

const isProd = process.env.NODE_ENV === 'production'

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    'https://a612e2487170f72afced68559c6f67d9@o4511214422458368.ingest.de.sentry.io/4511218913312848',
  release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: isProd ? 0.1 : 1.0,
  profileSessionSampleRate: isProd ? 0.1 : 1.0,
  profileLifecycle: 'trace',
  sendDefaultPii: false,
  beforeSend: redactSentryEvent,
  beforeSendTransaction: redactSentryEvent,
})
