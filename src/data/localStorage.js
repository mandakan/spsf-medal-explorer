import { DataManager } from './dataManager'
import { UserProfile } from '../models/Profile'

/**
 * LocalStorage-based data manager for POC phase
 * Stores everything in browser's localStorage under key 'medal-app-data'
 */
export class LocalStorageDataManager extends DataManager {
  constructor() {
    super()
    this.storageKey = 'medal-app-data'
    this.initializeStorage()
  }

  /**
   * Initialize storage structure if it doesn't exist
   */
  initializeStorage() {
    if (!this._hasStorage()) {
      throw new Error('localStorage is not available in this environment')
    }
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        version: '1.0',
        profiles: [],
        lastBackup: new Date().toISOString(),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    const data = this.getStorageData()
    const profile = data.profiles.find((p) => p.userId === userId) || null
    return profile
  }

  /**
   * Save or update user profile
   */
  async saveUserProfile(profile) {
    // Validate profile structure
    if (!this.validateProfile(profile)) {
      throw new Error('Invalid profile structure')
    }

    const data = this.getStorageData()
    const now = new Date().toISOString()
    profile.lastModified = now

    const index = data.profiles.findIndex((p) => p.userId === profile.userId)
    if (index >= 0) {
      // update
      data.profiles[index] = {
        ...data.profiles[index],
        ...profile,
        userId: data.profiles[index].userId, // never change id
      }
    } else {
      // create
      const newProfile = {
        userId: profile.userId || new UserProfile(profile).userId,
        displayName: profile.displayName || '',
        createdDate: now,
        lastModified: now,
        weaponGroupPreference: profile.weaponGroupPreference || 'A',
        unlockedMedals: Array.isArray(profile.unlockedMedals) ? profile.unlockedMedals : [],
        prerequisites: Array.isArray(profile.prerequisites) ? profile.prerequisites : [],
        notifications: Boolean(profile.notifications),
      }
      data.profiles.push(newProfile)
      profile = newProfile
    }

    this.saveStorageData(data)
    return profile
  }

  /**
   * Get all profiles (for profile selector)
   */
  async getAllProfiles() {
    const data = this.getStorageData()
    return data.profiles
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId) {
    const data = this.getStorageData()
    const before = data.profiles.length
    data.profiles = data.profiles.filter((p) => p.userId !== userId)
    if (data.profiles.length === before) {
      // no-op if not found
      return
    }
    this.saveStorageData(data)
  }

  /**
   * Get all achievements for user
   */
  async getAchievements(userId) {
    const profile = await this.getUserProfile(userId)
    return profile ? profile.prerequisites || [] : []
  }

  /**
   * Add achievement to profile
   */
  async addAchievement(userId, achievement) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    if (!this.validateAchievement(achievement)) {
      throw new Error('Invalid achievement structure')
    }

    const id = achievement.id || `achievement-${Date.now()}`
    const normalized = { ...achievement, id }

    profile.prerequisites = Array.isArray(profile.prerequisites) ? profile.prerequisites : []
    profile.prerequisites.push(normalized)
    await this.saveUserProfile(profile)
    return normalized
  }

  /**
   * Update existing achievement
   */
  async updateAchievement(userId, achievementId, achievement) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    const index = (profile.prerequisites || []).findIndex((a) => a.id === achievementId)
    if (index < 0) throw new Error('Achievement not found')

    const updated = { ...achievement, id: achievementId }
    if (!this.validateAchievement(updated)) {
      throw new Error('Invalid achievement structure')
    }

    profile.prerequisites[index] = updated
    await this.saveUserProfile(profile)
    return profile.prerequisites[index]
  }

  /**
   * Remove achievement from profile
   */
  async removeAchievement(userId, achievementId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    profile.prerequisites = (profile.prerequisites || []).filter((a) => a.id !== achievementId)
    await this.saveUserProfile(profile)
  }

  /**
   * Export profile data as JSON-compatible object
   */
  async exportData(userId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    return {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      userProfile: {
        displayName: profile.displayName,
        createdDate: profile.createdDate,
        weaponGroupPreference: profile.weaponGroupPreference,
      },
      achievements: profile.prerequisites || [],
      unlockedMedals: profile.unlockedMedals || [],
    }
  }

  /**
   * Import profile data from JSON string
   * Returns the saved profile
   * - Always creates a brand-new unique userId
   * - Normalizes achievements with ids if missing
   */
  async importData(jsonData) {
    const parsed = this.parseImportedJson(jsonData)

    // Basic validation of export payload
    this.validateExportPayload(parsed)

    // Generate a brand-new unique userId
    const existing = await this.getAllProfiles()
    const makeId = () => {
      try {
        // Prefer crypto.randomUUID when available (browser/jsdom)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return `user-${crypto.randomUUID()}`
        }
      } catch (_) {
        // ignore
      }
      return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }
    let newId = makeId()
    while (existing.some(p => p.userId === newId)) {
      newId = makeId()
    }

    // Normalize achievements: ensure each has an id
    const achievements = Array.isArray(parsed.achievements) ? parsed.achievements.map(a => {
      const id = a && a.id ? a.id : `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return { ...a, id }
    }) : []

    const profile = new UserProfile({
      userId: newId,
      displayName: (parsed.userProfile && parsed.userProfile.displayName) || '',
      weaponGroupPreference: (parsed.userProfile && parsed.userProfile.weaponGroupPreference) || 'A',
      prerequisites: achievements,
      unlockedMedals: Array.isArray(parsed.unlockedMedals) ? parsed.unlockedMedals : [],
    })

    return await this.saveUserProfile(profile)
  }

  /**
   * Validate profile structure per docs/02-Data-Model.md
   */
  validateProfile(profile) {
    if (!profile || typeof profile !== 'object') return false
    if (!profile.userId || typeof profile.userId !== 'string') return false
    if (typeof profile.displayName !== 'string') return false
    if (!Array.isArray(profile.unlockedMedals)) return false
    if (!Array.isArray(profile.prerequisites)) return false
    // Optional fields
    if (profile.weaponGroupPreference && !['A', 'B', 'C', 'R'].includes(profile.weaponGroupPreference)) {
      return false
    }
    return true
  }

  /**
   * Validate achievement structure with minimal business rules
   */
  validateAchievement(achievement) {
    if (!achievement || typeof achievement !== 'object') return false
    if (!achievement.type || typeof achievement.type !== 'string') return false
    if (typeof achievement.year !== 'number') return false
    if (!['A', 'B', 'C', 'R'].includes(achievement.weaponGroup || 'A')) return false

    if (achievement.type === 'precision_series') {
      if (typeof achievement.points !== 'number') return false
      if (achievement.points < 0 || achievement.points > 50) return false
    }

    if (achievement.type === 'competition_result') {
      const allowedTypes = ['national', 'regional/landsdels', 'crewmate/krets', 'championship']
      const allowedMedals = ['bronze', 'silver', 'gold']
      if (!allowedTypes.includes(achievement.competitionType || '')) return false
      if (!allowedMedals.includes(achievement.medalType || '')) return false
    }

    return true
  }

  /**
   * Get raw storage data
   */
  getStorageData() {
    if (!this._hasStorage()) {
      throw new Error('localStorage is not available in this environment')
    }
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) {
        // Reinitialize if somehow missing
        this.initializeStorage()
        return this.getStorageData()
      }
      const parsed = JSON.parse(data)
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
        throw new Error('Malformed storage root')
      }
      return parsed
    } catch (error) {
      console.error('Failed to read storage:', error)
      throw new Error('Storage data corrupted')
    }
  }

  /**
   * Save raw storage data
   */
  saveStorageData(data) {
    if (!this._hasStorage()) {
      throw new Error('localStorage is not available in this environment')
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      // Different browsers implement quota exceptions differently
      if (
        error &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          error.code === 22)
      ) {
        throw new Error('Storage quota exceeded')
      }
      throw error
    }
  }

  /**
   * Parse imported JSON string safely
   */
  parseImportedJson(jsonString) {
    try {
      // Accept both string and object input
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString
      return data
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`)
    }
  }

  /**
   * Validate export payload shape
   */
  validateExportPayload(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid export file: not an object')
    }
    if (!data.exportVersion) {
      throw new Error('Invalid export file: missing exportVersion')
    }
    if (!data.userProfile || typeof data.userProfile !== 'object') {
      throw new Error('Invalid export file: missing userProfile')
    }
    if (!('achievements' in data) || !Array.isArray(data.achievements)) {
      throw new Error('Invalid export file: missing achievements')
    }
    if (!('unlockedMedals' in data) || !Array.isArray(data.unlockedMedals)) {
      throw new Error('Invalid export file: missing unlockedMedals')
    }
  }

  _hasStorage() {
    try {
      return typeof localStorage !== 'undefined'
    } catch {
      return false
    }
  }
}
