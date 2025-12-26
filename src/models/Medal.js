/**
 * Represents a single medal in the SHB system
 */
const VALID_STATUS = new Set(['placeholder', 'under_review', 'reviewed'])
function normalizeStatus(status) {
  return VALID_STATUS.has(status) ? status : 'placeholder'
}
export class Medal {
  constructor(data) {
    this.id = data.id
    this.type = data.type
    this.tier = data.tier
    this.name = data.name
    this.displayName = data.displayName
    this.tierName = data.tierName
    this.color = data.color
    this.icon = data.icon
    this.status = normalizeStatus(data.status)
    this.prerequisites = data.prerequisites || []
    this.requirements = data.requirements || []
    this.unlocksFollowingMedals = data.unlocksFollowingMedals || []
    this.description = data.description || ''
    this.requirementsOriginal = data.requirements_original || ''
    this.references = Array.isArray(data.references) ? data.references : []
    this.yearIntroduced = data.yearIntroduced
    this.sortOrder = data.sortOrder
  }

  /**
   * Get human-readable display name with tier
   */
  getFullName() {
    const tierName = this.tier
      ? this.tier.charAt(0).toUpperCase() + this.tier.slice(1).replace('_', ' ')
      : ''
    return `${this.displayName}${tierName ? ` (${tierName})` : ''}`
  }

  /**
   * Get color for UI display
   */
  getColorClass() {
    const map = {
      '#FFD700': 'text-medal-gold',
      '#C0C0C0': 'text-medal-silver',
      '#CD7F32': 'text-medal-bronze',
    }
    return map[this.color] || 'text-foreground'
  }
  isPlaceholder() {
    return this.status === 'placeholder'
  }
  isUnderReview() {
    return this.status === 'under_review'
  }
  isReviewed() {
    return this.status === 'reviewed'
  }
}

/**
 * Medal database manager
 */
export class MedalDatabase {
  constructor(medalDataJson) {
    this.medals = (medalDataJson.medals || []).map(m => new Medal(m))
  }

  getMedalById(medalId) {
    return this.medals.find(m => m.id === medalId)
  }

  getMedalsByType(type) {
    return this.medals.filter(m => m.type === type)
  }

  getMedalsByTier(tier) {
    return this.medals.filter(m => m.tier === tier)
  }

  getAllMedals() {
    return [...this.medals]
  }
}
