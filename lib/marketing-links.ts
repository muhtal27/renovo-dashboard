const configuredDashboardSignInUrl = process.env.NEXT_PUBLIC_DASHBOARD_SIGN_IN_URL?.trim()

export const DASHBOARD_SIGN_IN_URL =
  configuredDashboardSignInUrl && configuredDashboardSignInUrl.length > 0
    ? configuredDashboardSignInUrl
    : '/login'

export const DASHBOARD_SIGN_IN_EXTERNAL = /^https?:\/\//i.test(DASHBOARD_SIGN_IN_URL)
