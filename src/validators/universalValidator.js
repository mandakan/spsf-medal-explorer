/**
 * Universal validators for achievement forms and mapped achievement objects.
 * Keep rules aligned with LocalStorageDataManager.validateAchievement:
 * - type: string
 * - year: number
 * - weaponGroup: one of A/B/C/R (defaults to 'A' upstream)
 * - For type 'precision_series': points: number between 0..50
 */

const WG = ['A', 'B', 'C', 'R']
const COMP_DISCIPLINE_TYPES = ['national_whole_match', 'military_fast_match', 'ppc']

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

  const dt = String(values.disciplineType || '').toLowerCase()
  if (!COMP_DISCIPLINE_TYPES.includes(dt)) {
    errors.disciplineType = 'Select a valid discipline'
  }
  if (dt === 'ppc') {
    const cls = String(values.ppcClass || '').trim()
    if (!cls) {
      errors.ppcClass = 'PPC class is required for PPC discipline'
    }
  }

  if (values.score === '' || values.score == null || Number.isNaN(Number(values.score))) {
    errors.score = 'Enter a valid score/points'
  } else {
    const n = Number(values.score)
    if (n < 0) errors.score = 'Score cannot be negative'
  }
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
  if (type === 'precision_series') {
    const pts = achievement.points
    if (typeof pts !== 'number' || Number.isNaN(pts)) {
      errors.push('Points required for precision series')
    } else {
      if (pts < 0 || pts > 50) errors.push('Points must be between 0 and 50')
    }
  }
  if (type === 'application_series') {
    const t = achievement.timeSeconds
    const h = achievement.hits
    if (typeof t !== 'number' || Number.isNaN(t) || t <= 0) {
      errors.push('Time required for application series')
    }
    if (typeof h !== 'number' || Number.isNaN(h) || h < 0) {
      errors.push('Hits required for application series')
    }
  }
  if (type === 'competition_result') {
    const sc = achievement.score
    const dt = String(achievement.disciplineType || '').toLowerCase()
    if (typeof sc !== 'number' || Number.isNaN(sc) || sc < 0) {
      errors.push('Score required for competition result')
    }
    if (!dt || !['national_whole_match', 'military_fast_match', 'ppc'].includes(dt)) {
      errors.push('Discipline required for competition result')
    }
    if (dt === 'ppc') {
      const cls = achievement.ppcClass
      if (!cls || String(cls).trim() === '') {
        errors.push('PPC class required for PPC discipline')
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
