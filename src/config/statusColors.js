export const STATUS_COLOR_VARS = {
  review: '--color-review',
  placeholder: '--color-placeholder',
  locked: '--color-status-locked',
  available: '--color-status-available',
  eligible: '--color-status-eligible',
  unlocked: '--color-status-unlocked',
}

export function getStatusColorVar(status) {
  return STATUS_COLOR_VARS[status] || null
}

function getStatusColorValue(
  status,
  root = typeof document !== 'undefined' ? document.documentElement : null
) {
  const varName = getStatusColorVar(status)
  if (!varName || !root || typeof getComputedStyle !== 'function') return null
  const v = getComputedStyle(root).getPropertyValue(varName).trim()
  return v || null
}
