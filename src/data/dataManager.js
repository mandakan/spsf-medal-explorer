/**
 * Abstract data manager interface
 * All storage implementations (localStorage, API, etc.) must implement these methods
 */
export class DataManager {
  // User Profile Operations
  async getUserProfile(_userId) {
    throw new Error('Not implemented')
  }

  async saveUserProfile(_profile) {
    throw new Error('Not implemented')
  }

  async getAllProfiles() {
    throw new Error('Not implemented')
  }

  async deleteProfile(_userId) {
    throw new Error('Not implemented')
  }

  // Achievement Operations
  async getAchievements(_userId) {
    throw new Error('Not implemented')
  }

  async addAchievement(_userId, _achievement) {
    throw new Error('Not implemented')
  }

  async updateAchievement(_userId, _achievementId, _achievement) {
    throw new Error('Not implemented')
  }

  async removeAchievement(_userId, _achievementId) {
    throw new Error('Not implemented')
  }

  // Import/Export
  async exportData(_userId) {
    throw new Error('Not implemented')
  }

  async importData(_jsonData) {
    throw new Error('Not implemented')
  }
}
