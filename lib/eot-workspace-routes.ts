export function getDefaultEotWorkspaceHref(caseId: string) {
  return `/checkouts/${caseId}`
}

export function getPreviewCheckoutWorkspaceHref(caseId: string) {
  return `/operator/cases/${caseId}`
}
