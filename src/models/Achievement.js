/**
 * Represents a single achievement (gold series, competition result, etc.)
 */
export class Achievement {
  constructor(data) {
    this.id = data.id || `achievement-${Date.now()}`
    this.type = data.type // 'gold_series', 'competition_result', etc.
    this.year = data.year
    this.weaponGroup = data.weaponGroup
    this.points = typeof data.points === 'number' ? data.points : (data.points != null && data.points !== '' ? Number(data.points) : data.points)
    this.date = data.date
    this.competitionName = data.competitionName || ''
    this.notes = data.notes || ''
  }
}
