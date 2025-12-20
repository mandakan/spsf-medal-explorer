import { InputValidator } from './validator'

export function validateAchievements(achievements) {
  const errors = {}
  const validAchievements = []

  achievements.forEach((ach, index) => {
    if (ach == null) return
    if (ach.points === '' || ach.points == null) return // Skip empty rows

    const validation = InputValidator.validatePrecisionSeriesInput(ach)
    if (!validation.isValid) {
      errors[index] = validation.errors
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
