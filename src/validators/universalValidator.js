/**
 * Universal validators for achievement forms and mapped achievement objects.
 * Keep rules aligned with LocalStorageDataManager.validateAchievement:
 * - type: string
 * - year: number
 * - weaponGroup: one of A/B/C/R (defaults to 'A' upstream)
 * - For type 'gold_series': points: number between 0..50
 */

const WG = ['A', 'B', 'C', 'R']

function isFutureDate(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() > today.getTime()
}

export function validateCompetition(values /* , medal */) {
  const errors = {}
  if (!values.date) {
    errors.date = 'Date is required'
  } else if (isFutureDate(values.date)) {
    errors.date = 'Date cannot be in the future'
  }
  if (!values.weaponGroup || !WG.includes(values.weaponGroup)) {
    errors.weaponGroup = 'Select a valid weapon group'
  }
  if (values.score === '' || values.score == null || Number.isNaN(Number(values.score))) {
    errors.score = 'Enter a valid score/points'
  } else {
    const n = Number(values.score)
    if (n < 0) errors.score = 'Score cannot be negative'
  }
  return errors
}

export function validateQualification(values /* , medal */) {
  const errors = {}
  if (!values.date) {
    errors.date = 'Date is required'
  } else if (isFutureDate(values.date)) {
    errors.date = 'Date cannot be in the future'
  }
  if (!values.weaponGroup || !WG.includes(values.weaponGroup)) {
    errors.weaponGroup = 'Select a valid weapon group'
  }
  if (!values.weapon) {
    errors.weapon = 'Weapon is required'
  }
  if (values.score === '' || values.score == null || Number.isNaN(Number(values.score))) {
    errors.score = 'Enter a valid score'
  }
  return errors
}

export function validateTeamEvent(values /* , medal */) {
  const errors = {}
  if (!values.date) {
    errors.date = 'Date is required'
  } else if (isFutureDate(values.date)) {
    errors.date = 'Date cannot be in the future'
  }
  if (!values.weaponGroup || !WG.includes(values.weaponGroup)) {
    errors.weaponGroup = 'Select a valid weapon group'
  }
  if (!values.teamName) {
    errors.teamName = 'Team name is required'
  }
  const pos = Number(values.position)
  if (!Number.isFinite(pos) || pos < 1 || pos > 100) {
    errors.position = 'Enter a valid position (1-100)'
  }
  return errors
}

export function validateEvent(values /* , medal */) {
  const errors = {}
  if (!values.date) {
    errors.date = 'Date is required'
  } else if (isFutureDate(values.date)) {
    errors.date = 'Date cannot be in the future'
  }
  if (!values.weaponGroup || !WG.includes(values.weaponGroup)) {
    errors.weaponGroup = 'Select a valid weapon group'
  }
  if (!values.eventName) {
    errors.eventName = 'Event name is required'
  }
  return errors
}

export function validateCustom(values /* , medal */) {
  const errors = {}
  if (!values.date) {
    errors.date = 'Date is required'
  } else if (isFutureDate(values.date)) {
    errors.date = 'Date cannot be in the future'
  }
  if (!values.weaponGroup || !WG.includes(values.weaponGroup)) {
    errors.weaponGroup = 'Select a valid weapon group'
  }
  // eventName optional, notes optional
  return errors
}

/**
 * Validate final mapped achievement object before saving.
 */
export function validateAchievement(achievement) {
  const errors = []
  if (!achievement || typeof achievement !== 'object') {
    return { valid: false, errors: ['Invalid achievement object'] }
  }
  const { type, year, weaponGroup } = achievement
  if (!type || typeof type !== 'string') {
    errors.push('Invalid type')
  }
  if (typeof year !== 'number' || Number.isNaN(year)) {
    errors.push('Invalid year')
  }
  if (!weaponGroup || !WG.includes(weaponGroup)) {
    errors.push('Invalid weapon group')
  }
  if (type === 'gold_series') {
    const pts = achievement.points
    if (typeof pts !== 'number' || Number.isNaN(pts)) {
      errors.push('Points required for gold series')
    } else {
      if (pts < 0 || pts > 50) errors.push('Points must be between 0 and 50')
    }
  }
  return { valid: errors.length === 0, errors }
}
