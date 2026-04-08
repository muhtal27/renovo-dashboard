const PROTECTED_OPERATOR_ROUTES = [
  '/admin',
  '/dashboard',
  '/tenancies',
  '/tenancy',
  '/disputes',
  '/recommendations',
  '/reports',
  '/calls',
  '/guidance',
  '/settings',
  '/account/billing',
  '/inventory-feedback',
  '/deposit-scheme',
] as const

const PROTECTED_OPERATOR_PREFIXES = ['/tenancies/', '/dashboard/', '/cases/', '/operator/cases/', '/settings/', '/teams/', '/account/'] as const

const protectedOperatorRouteSet = new Set<string>(PROTECTED_OPERATOR_ROUTES)

export function matchesProtectedOperatorPath(pathname: string) {
  return (
    protectedOperatorRouteSet.has(pathname) ||
    PROTECTED_OPERATOR_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

export function shouldProtectPath(pathname: string) {
  return matchesProtectedOperatorPath(pathname)
}

export function shouldNoIndexPath(pathname: string) {
  return matchesProtectedOperatorPath(pathname) || pathname.startsWith('/api/')
}

export { PROTECTED_OPERATOR_PREFIXES, PROTECTED_OPERATOR_ROUTES }
