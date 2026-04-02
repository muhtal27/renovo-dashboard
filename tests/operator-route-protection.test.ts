import test from 'node:test'
import assert from 'node:assert/strict'
import {
  shouldNoIndexPath,
  shouldProtectPath,
} from '@/lib/operator-route-protection'
import {
  getDefaultEotWorkspaceHref,
  getPreviewCheckoutWorkspaceHref,
} from '@/lib/eot-workspace-routes'

test('critical operator routes stay protected by middleware', () => {
  const protectedRoutes = ['/reports', '/checkouts', '/knowledge', '/settings']

  for (const route of protectedRoutes) {
    assert.equal(
      shouldProtectPath(route),
      true,
      `${route} should be protected by middleware`
    )
  }
})

test('operator sub-routes stay protected by middleware', () => {
  assert.equal(shouldProtectPath('/checkouts/123'), true)
  assert.equal(shouldProtectPath('/cases/123'), true)
  assert.equal(shouldProtectPath('/operator/cases/123'), true)
})

test('api routes stay noindex even when not middleware-protected', () => {
  assert.equal(shouldNoIndexPath('/api/eot/cases'), true)
})

test('public routes remain unprotected', () => {
  assert.equal(shouldProtectPath('/login'), false)
  assert.equal(shouldProtectPath('/'), false)
})

test('operator workspace keeps legacy route canonical and preview route explicit', () => {
  assert.equal(getDefaultEotWorkspaceHref('case-123'), '/checkouts/case-123')
  assert.equal(getPreviewCheckoutWorkspaceHref('case-123'), '/operator/cases/case-123')
})
