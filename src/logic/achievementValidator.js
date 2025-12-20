import { InputValidator } from './validator'

export function validateAchievements(achievements) {
  const errors = {}
  const validAchievements = []

  achievements.forEach((ach, index) => {
    if (ach == null) return
    if (ach.points === '' || ach.points == null) return // Skip empty rows

    const validation = InputValidator.validateGoldSeriesInput(ach)
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
    const key = `${ach.year}-${ach.type}-${ach.weaponGroup}-${ach.points}`
    if (seen.has(key)) {
      duplicates.push(key)
    }
    seen.add(key)
  })

  return duplicates
}
