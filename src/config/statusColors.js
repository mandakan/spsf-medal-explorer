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
