import { StatusBadge, formatEnumLabel } from '@/app/eot/_components/eot-ui'

export function CaseStatusBadge({
  status,
}: {
  status: string
}) {
  return <StatusBadge label={formatEnumLabel(status)} tone={status} />
}
