/**
 * Abstract data manager interface
 * All storage implementations (localStorage, API, etc.) must implement these methods
 */
export class DataManager {
  // User Profile Operations
  async getUserProfile(userId) {
    throw new Error('Not implemented')
  }

  async saveUserProfile(profile) {
    throw new Error('Not implemented')
  }

  async getAllProfiles() {
    throw new Error('Not implemented')
  }

  async deleteProfile(userId) {
    throw new Error('Not implemented')
  }

  // Achievement Operations
  async getAchievements(userId) {
    throw new Error('Not implemented')
  }

  async addAchievement(userId, achievement) {
    throw new Error('Not implemented')
  }

  async updateAchievement(userId, achievementId, achievement) {
    throw new Error('Not implemented')
  }

  async removeAchievement(userId, achievementId) {
    throw new Error('Not implemented')
  }

  // Import/Export
  async exportData(userId) {
    throw new Error('Not implemented')
  }

  async importData(jsonData) {
    throw new Error('Not implemented')
  }
}
