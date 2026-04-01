const PROTECTED_OPERATOR_ROUTES = [
  '/overview',
  '/eot',
  '/tenancy',
  '/disputes',
  '/recommendations',
  '/claims',
  '/reports',
  '/calls',
  '/knowledge',
  '/settings',
] as const

const PROTECTED_OPERATOR_PREFIXES = ['/eot/', '/cases/', '/operator/cases/', '/settings/'] as const

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
