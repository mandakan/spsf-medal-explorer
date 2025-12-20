/**
 * Represents a single achievement (gold series, competition result, etc.)
 */
export class Achievement {
  constructor(data) {
    this.id = data.id || `achievement-${Date.now()}`
    this.type = data.type // 'gold_series', 'competition_result', etc.
    this.medalId = data.medalId

    // Date and year (derive year from date if needed)
    this.date = data.date
    const yearIsNumber = typeof data.year === 'number' && Number.isFinite(data.year)
    const yearFromDate = this.date ? new Date(this.date).getFullYear() : undefined
    this.year = yearIsNumber ? data.year : (Number.isFinite(yearFromDate) ? yearFromDate : undefined)

    // Required in storage validator; default to 'A' if missing
    this.weaponGroup = data.weaponGroup || 'A'

    // Numeric normalization for points (used for gold_series)
    this.points = typeof data.points === 'number'
      ? data.points
      : (data.points != null && data.points !== '' ? Number(data.points) : undefined)

    // competition_result specific fields required by validator
    this.competitionType = data.competitionType
    this.medalType = data.medalType

    // Common optional fields
    this.competitionName = data.competitionName || ''
    this.notes = data.notes || ''
  }
}
