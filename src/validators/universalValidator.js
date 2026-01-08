/**
 * Universal validators for achievement forms and mapped achievement objects.
 * Keep rules aligned with LocalStorageDataManager.validateAchievement:
 * - type: string
 * - year: number
 * - weaponGroup: one of A/B/C/R (defaults to 'A' upstream)
 * - For type 'precision_series': points: number between 0..50
 */

const WG = ['A', 'B', 'C', 'R']
const COMP_DISCIPLINE_TYPES = ['national_whole_match', 'military_fast_match', 'ppc', 'precision', 'field']
const COMPETITION_TYPES = ['rikstavlingen', 'riks', 'nationell', 'landsdel', 'krets']

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
    if (!dt || !COMP_DISCIPLINE_TYPES.includes(dt)) {
      errors.push('Discipline required for competition result')
    }
    if (dt === 'ppc') {
      const cls = achievement.ppcClass
      if (!cls || String(cls).trim() === '') {
        errors.push('PPC class required for PPC discipline')
      }
    }
    // Optional fields for championship mark requirements
    if (achievement.competitionType && !COMPETITION_TYPES.includes(achievement.competitionType)) {
      errors.push('Invalid competition type')
    }
    if (achievement.seriesCount != null) {
      const sc = Number(achievement.seriesCount)
      if (Number.isNaN(sc) || ![6, 7, 10].includes(sc)) {
        errors.push('Series count must be 6, 7, or 10')
      }
    }
  }
  if (type === 'running_shooting_course') {
    const pts = achievement.points
    if (typeof pts !== 'number' || Number.isNaN(pts) || pts < 0) {
      errors.push('Points required for running shooting course')
    }
    if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
      errors.push('Date required for running shooting course')
    } else if (isFutureDate(achievement.date)) {
      errors.push('Date cannot be in the future')
    }
  }
  if (type === 'shooting_round') {
    const pts = achievement.totalPoints
    if (typeof pts !== 'number' || Number.isNaN(pts) || pts < 0) {
      errors.push('Total points required for shooting round')
    }
    // Each shooting round comprises 3 series (150s, 20s, 10s), max 15 points per serie = 45 max
    if (pts > 150) {
      errors.push('Total points cannot exceed 150')
    }
  }
  if (type === 'speed_shooting_series') {
    const pts = achievement.points
    if (typeof pts !== 'number' || Number.isNaN(pts)) {
      errors.push('Points required for speed shooting series')
    } else {
      // 5 shots per series, max 10 points per shot = 50 max
      if (pts < 0 || pts > 50) {
        errors.push('Points must be between 0 and 50')
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
