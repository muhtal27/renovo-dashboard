type PostgrestErrorLike = {
  code?: string | null
  details?: string | null
  hint?: string | null
  message?: string | null
}

function toErrorText(error: PostgrestErrorLike | null | undefined) {
  return [error?.code, error?.message, error?.details, error?.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase()
}

export function isMissingColumnError(
  error: PostgrestErrorLike | null | undefined,
  ...columnNames: string[]
) {
  if (!error) {
    return false
  }

  const errorText = toErrorText(error)

  if (!errorText) {
    return false
  }

  if (errorText.includes('column') && errorText.includes('does not exist')) {
    if (columnNames.length === 0) {
      return true
    }

    return columnNames.some((columnName) => errorText.includes(columnName.toLowerCase()))
  }

  return false
}

export function getOptionalString(
  row: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return null
}

export function getOptionalBoolean(
  row: Record<string, unknown>,
  key: string
) {
  const value = row[key]
  return typeof value === 'boolean' ? value : null
}

export function hasNonNullValue(
  row: Record<string, unknown>,
  key: string
) {
  return row[key] !== null && row[key] !== undefined
}

export function getOptionalTimestamp(
  row: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.length > 0) {
      const timestamp = Date.parse(value)

      if (!Number.isNaN(timestamp)) {
        return timestamp
      }
    }
  }

  return null
}
