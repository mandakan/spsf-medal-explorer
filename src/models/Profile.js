/**
 * Represents a user's profile and achievements
 */
export const DEFAULT_PROFILE_FEATURES = {
  allowManualUnlock: true,
  enforceCurrentYearForSustained: false,
}
export class UserProfile {
  constructor(data) {
    this.userId = data.userId || `user-${Date.now()}`
    this.displayName = data.displayName || ''
    this.createdDate = data.createdDate || new Date().toISOString()
    this.lastModified = data.lastModified || new Date().toISOString()
    this.dateOfBirth = data.dateOfBirth || ''
    this.unlockedMedals = data.unlockedMedals || []
    this.prerequisites = data.prerequisites || []
    this.features = {
      ...DEFAULT_PROFILE_FEATURES,
      ...(data.features || {}),
    }
    this.isGuest = Boolean(data.isGuest)
  }

  /**
   * Update modification timestamp
   */
  touch() {
    this.lastModified = new Date().toISOString()
  }
}
