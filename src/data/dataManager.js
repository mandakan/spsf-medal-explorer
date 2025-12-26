/**
 * Abstract data manager interface
 * All storage implementations (localStorage, API, etc.) must implement these methods
 */
export class DataManager {
  // User Profile Operations
  /**
   * Get a user's profile.
   * @param {string} userId
   */
  async getUserProfile() {
    throw new Error('Not implemented')
  }

  /**
   * Save a user profile.
   * @param {object} profile
   */
  async saveUserProfile() {
    throw new Error('Not implemented')
  }

  async getAllProfiles() {
    throw new Error('Not implemented')
  }

  /**
   * Delete a user profile.
   * @param {string} userId
   */
  async deleteProfile() {
    throw new Error('Not implemented')
  }

  // Achievement Operations
  /**
   * Get all achievements for a user.
   * @param {string} userId
   */
  async getAchievements() {
    throw new Error('Not implemented')
  }

  /**
   * Add an achievement for a user.
   * @param {string} userId
   * @param {object} achievement
   */
  async addAchievement() {
    throw new Error('Not implemented')
  }

  /**
   * Update an existing achievement.
   * @param {string} userId
   * @param {string} achievementId
   * @param {object} achievement
   */
  async updateAchievement() {
    throw new Error('Not implemented')
  }

  /**
   * Upsert multiple achievements with options.
   * @param {string} userId
   * @param {Array<object>} rows
   * @param {object} options
   */
  async upsertAchievements() {
    throw new Error('Not implemented')
  }

  /**
   * Remove an achievement.
   * @param {string} userId
   * @param {string} achievementId
   */
  async removeAchievement() {
    throw new Error('Not implemented')
  }

  // Import/Export
  /**
   * Export data for a user.
   * @param {string} userId
   */
  async exportData() {
    throw new Error('Not implemented')
  }

  /**
   * Import data in JSON format.
   * @param {string|object} jsonData
   */
  async importData() {
    throw new Error('Not implemented')
  }
}
