import { InputValidator } from './validator'
import { validateAchievement as validateAchievementObj } from '../validators/universalValidator'

export function validateAchievements(achievements) {
  const errors = {}
  const validAchievements = []

  achievements.forEach((ach, index) => {
    if (ach == null) return

    const t = ach.type
    // Skip “empty” rows per type (batch UX)
    if (t === 'precision_series' && (ach.points === '' || ach.points == null)) return
    if (t === 'application_series' && ((ach.timeSeconds === '' || ach.timeSeconds == null) && (ach.hits === '' || ach.hits == null))) return
    if (t === 'competition_result' && (ach.score === '' || ach.score == null)) return
    if (t === 'qualification_result' && (ach.score === '' || ach.score == null)) return

    let valid = true
    let rowErrors = []

    if (t === 'precision_series' && typeof InputValidator?.validatePrecisionSeriesInput === 'function') {
      const res = InputValidator.validatePrecisionSeriesInput({
        year: ach.year,
        weaponGroup: ach.weaponGroup,
        points: ach.points
      })
      valid = !!res.isValid
      rowErrors = res.errors || []
    } else {
      const res = validateAchievementObj(ach)
      valid = !!res.valid
      rowErrors = res.errors || []
    }

    if (!valid) {
      errors[index] = rowErrors
    } else {
      validAchievements.push(ach)
    }
  })

  return {
    isValid: validAchievements.length > 0,
    errors,
    validAchievements
  }
}

export function detectDuplicateAchievements(achievements) {
  const seen = new Set()
  const duplicates = []

  achievements.forEach(ach => {
    if (!ach) return
    if (ach.type === 'application_series') {
      return
    }
    let key
    if (ach.type === 'precision_series') {
      key = `${ach.year}-${ach.type}-${ach.weaponGroup}-${ach.points}`
    } else if (ach.type === 'competition_result') {
      // Use a richer key to avoid false duplicates across competitions
      key = `${ach.year}-${ach.type}-${ach.weaponGroup}-${ach.disciplineType || ''}-${ach.date || ''}-${ach.score ?? ''}`
    } else {
      key = `${ach.year}-${ach.type}-${ach.weaponGroup}`
    }
    if (seen.has(key)) {
      duplicates.push(key)
    }
    seen.add(key)
  })

  return duplicates
}
