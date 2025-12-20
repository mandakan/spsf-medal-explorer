/**
 * Validates user inputs against SHB rules
 */
export class InputValidator {
  static validatePrecisionSeriesInput(input) {
    const errors = []
    const currentYear = new Date().getFullYear()

    if (typeof input.year !== 'number' || input.year < 2000 || input.year > currentYear) {
      errors.push(`Year must be between 2000 and ${currentYear}`)
    }

    if (!['A', 'B', 'C', 'R'].includes(input.weaponGroup)) {
      errors.push('Invalid weapon group. Must be A, B, C, or R.')
    }

    if (typeof input.points !== 'number' || input.points < 0 || input.points > 50) {
      errors.push('Points must be between 0 and 50')
    }

    if (input.date) {
      const d = new Date(input.date)
      if (Number.isNaN(d.getTime())) {
        errors.push('Date is invalid')
      } else if (d > new Date()) {
        errors.push('Date cannot be in the future')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateApplicationSeriesInput(input) {
    return this.validatePrecisionSeriesInput(input)
  }
}
