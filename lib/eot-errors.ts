export function getEotUiErrorMessage(error: string | null | undefined) {
  if (!error) {
    return 'Unable to load the end-of-tenancy data.'
  }

  if (error.includes('Missing EOT_INTERNAL_AUTH_SECRET in the Next.js runtime environment')) {
    return 'The operator app is missing its EOT internal-auth configuration. Set EOT_INTERNAL_AUTH_SECRET in the frontend runtime before using checkout routes.'
  }

  if (error.includes('EOT internal authentication is not configured')) {
    return 'The EOT backend is missing its internal-auth configuration. Set EOT_INTERNAL_AUTH_SECRET for the backend before using checkout routes.'
  }

  if (error.includes('Trusted operator context is invalid.')) {
    return 'The frontend and backend EOT internal-auth configuration do not match. Align EOT_INTERNAL_AUTH_SECRET on both services.'
  }

  if (error.includes('Unable to reach the EOT backend')) {
    return 'The operator app could not reach the EOT backend. Confirm the backend is running and that EOT_API_BASE_URL points to it.'
  }

  return error
}
