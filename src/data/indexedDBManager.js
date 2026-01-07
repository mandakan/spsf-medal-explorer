import { DataManager } from './dataManager'
import { UserProfile, DEFAULT_PROFILE_FEATURES, VALID_PROFILE_SEX } from '../models/Profile'

const DB_NAME_PREFIX = 'medal-app'
const DB_VERSION = 1
const STORES = {
  PROFILES: 'profiles',
  METADATA: 'metadata',
}

/**
 * IndexedDB implementation of DataManager
 * Provides async storage with 50MB+ capacity
 */
export class IndexedDBManager extends DataManager {
  constructor() {
    super()
    this.db = null
    this.dbName = this._generateDBName()
    this._lastValidationReasons = []
  }

  /**
   * Generate DB name including subfolder for isolation
   * Examples:
   *   prod: medal-app-main
   *   test: medal-app-test
   */
  _generateDBName() {
    const path = window.location.pathname
    const folder = path.split('/')[1] || 'main'
    return `${DB_NAME_PREFIX}-${folder}`
  }

  /**
   * Initialize IndexedDB connection and create schema
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION)

      request.onerror = () => {
        reject(new Error('IndexedDB open failed'))
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create profiles object store
        if (!db.objectStoreNames.contains(STORES.PROFILES)) {
          const profileStore = db.createObjectStore(STORES.PROFILES, {
            keyPath: 'userId',
          })
          profileStore.createIndex('lastModified', 'lastModified', { unique: false })
          profileStore.createIndex('createdDate', 'createdDate', { unique: false })
        }

        // Create metadata object store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * Get user profile by ID
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async getUserProfile(userId) {
    const profile = await this._transaction(STORES.PROFILES, 'readonly', (store) => {
      return store.get(userId)
    })
    return profile || null
  }

  /**
   * Save or update user profile
   * @param {object} profile
   * @returns {Promise<object>}
   */
  async saveUserProfile(profile) {
    // Validate profile structure
    if (!this.validateProfile(profile)) {
      throw new Error('Invalid profile structure')
    }

    // Normalize features
    const features = {
      allowManualUnlock:
        profile.features?.allowManualUnlock != null
          ? !!profile.features.allowManualUnlock
          : DEFAULT_PROFILE_FEATURES.allowManualUnlock,
      enforceCurrentYearForSustained:
        profile.features?.enforceCurrentYearForSustained != null
          ? !!profile.features.enforceCurrentYearForSustained
          : DEFAULT_PROFILE_FEATURES.enforceCurrentYearForSustained,
    }

    const now = new Date().toISOString()
    const existing = await this.getUserProfile(profile.userId)

    let savedProfile
    if (existing) {
      // Update existing profile
      savedProfile = {
        ...existing,
        ...profile,
        sex: profile.sex,
        features,
        userId: existing.userId, // never change id
        lastModified: now,
      }
    } else {
      // Create new profile
      savedProfile = {
        userId: profile.userId || new UserProfile(profile).userId,
        displayName: profile.displayName || '',
        createdDate: now,
        lastModified: now,
        dateOfBirth: profile.dateOfBirth,
        sex: profile.sex,
        unlockedMedals: Array.isArray(profile.unlockedMedals) ? profile.unlockedMedals : [],
        prerequisites: Array.isArray(profile.prerequisites) ? profile.prerequisites : [],
        notifications: Boolean(profile.notifications),
        features,
      }
    }

    await this._transaction(STORES.PROFILES, 'readwrite', (store) => {
      return store.put(savedProfile)
    })

    return savedProfile
  }

  /**
   * Get all profiles
   * @returns {Promise<Array>}
   */
  async getAllProfiles() {
    const profiles = await this._transaction(STORES.PROFILES, 'readonly', (store) => {
      return store.getAll()
    })
    return profiles || []
  }

  /**
   * Delete a profile
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteProfile(userId) {
    await this._transaction(STORES.PROFILES, 'readwrite', (store) => {
      return store.delete(userId)
    })
  }

  /**
   * Ensure all achievements have an id (migration helper)
   */
  _ensureAchievementIds(profile) {
    let changed = false
    profile.prerequisites = Array.isArray(profile.prerequisites) ? profile.prerequisites : []
    profile.prerequisites.forEach((a, i) => {
      if (!a.id) {
        a.id = `achievement-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`
        changed = true
      }
    })
    return changed
  }

  /**
   * Get all achievements for user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getAchievements(userId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) return []
    const changed = this._ensureAchievementIds(profile)
    if (changed) await this.saveUserProfile(profile)
    return profile ? (profile.prerequisites || []) : []
  }

  /**
   * Build a conservative natural key for matching
   */
  buildNaturalKey(ach) {
    const base = [ach.type, ach.year, ach.weaponGroup]
      .map((v) => String(v ?? '').trim().toLowerCase())
      .join('|')
    switch (ach.type) {
      case 'precision_series':
        return `${base}|${String(ach.points ?? '').trim()}`
      case 'standard_medal':
        return `${base}|${(ach.disciplineType || '').toLowerCase()}|${(ach.medalType || '').toLowerCase()}`
      case 'competition_result': {
        const disc = (ach.disciplineType || '').toLowerCase()
        const ppc = (ach.ppcClass || '').toLowerCase()
        const date = String(ach.date || '').toLowerCase()
        const score = String(ach.score ?? '').trim()
        return `${base}|${disc}|${ppc}|${date}|${score}`
      }
      case 'qualification_result':
        return `${base}|${(ach.weapon || '').toLowerCase()}|${String(ach.score ?? '').trim()}`
      case 'team_event':
        return `${base}|${(ach.teamName || '').toLowerCase()}|${String(ach.position ?? '').trim()}`
      case 'event':
        return `${base}|${(ach.eventName || '').toLowerCase()}`
      case 'running_shooting_course': {
        const date = String(ach.date || '').toLowerCase()
        const pts = String(ach.points ?? '').trim()
        return `${base}|${date}|${pts}`
      }
      default:
        return null
    }
  }

  /**
   * Upsert achievements with dry-run support
   */
  async upsertAchievements(
    userId,
    rows,
    { updateById = true, matchNaturalKey = false, addNew = true, dryRun = true } = {}
  ) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')
    this._ensureAchievementIds(profile)

    const current = Array.isArray(profile.prerequisites) ? profile.prerequisites : []
    const byId = new Map(current.map((a) => [a.id, a]))
    const byKey = new Map()
    if (matchNaturalKey) {
      for (const a of current) {
        const k = this.buildNaturalKey(a)
        if (k) byKey.set(k, a)
      }
    }

    const next = [...current]
    const result = { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }

    for (let i = 0; i < (rows || []).length; i++) {
      const rec = rows[i]
      try {
        const ok = this.validateAchievement(rec)
        if (!ok) {
          const reasonText =
            Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
              ? this._lastValidationReasons.join('; ')
              : 'Invalid achievement structure'
          console.groupCollapsed(`[IndexedDBManager] Validation failed for row #${i + 1}`)
          console.error('Reason:', reasonText)
          console.log('Record:', rec)
          console.groupEnd()
          result.failed++
          result.errors.push({ record: rec, row: i + 1, error: reasonText })
          continue
        }
      } catch (e) {
        console.groupCollapsed(`[IndexedDBManager] Exception validating row #${i + 1}`)
        console.error(e)
        console.log('Record:', rec)
        console.groupEnd()
        result.failed++
        result.errors.push({ record: rec, row: i + 1, error: e?.message || 'Validation failed' })
        continue
      }

      let target = null
      if (updateById && rec.id && byId.has(rec.id)) {
        target = byId.get(rec.id)
        console.debug('[IndexedDBManager] Matched by id', { row: i + 1, id: rec.id })
      } else if (matchNaturalKey) {
        const k = this.buildNaturalKey(rec)
        if (k) {
          if (byKey.has(k)) {
            console.debug('[IndexedDBManager] Matched by natural key', { row: i + 1, key: k })
            target = byKey.get(k)
          } else {
            console.debug('[IndexedDBManager] No match by natural key', { row: i + 1, key: k })
          }
        } else {
          console.debug('[IndexedDBManager] No natural key for record', { row: i + 1 })
        }
      }

      if (target) {
        const idx = next.findIndex((a) => a.id === target.id)
        if (idx >= 0) {
          next[idx] = { ...rec, id: target.id }
          result.updated++
          console.info('[IndexedDBManager] Updated achievement', { row: i + 1, id: target.id })
        }
        continue
      }

      if (addNew) {
        const id =
          rec.id && !byId.has(rec.id)
            ? rec.id
            : `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        next.push({ ...rec, id })
        result.added++
        console.info('[IndexedDBManager] Added achievement', { row: i + 1, id })
      } else {
        result.skipped++
        console.info('[IndexedDBManager] Skipped (addNew=false)', { row: i + 1 })
      }
    }

    if (!dryRun) {
      profile.prerequisites = next
      await this.saveUserProfile(profile)
    }

    return result
  }

  /**
   * Add achievement to profile
   */
  async addAchievement(userId, achievement) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    const ok = this.validateAchievement(achievement)
    if (!ok) {
      const reasons =
        Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
          ? this._lastValidationReasons.join('; ')
          : 'Invalid achievement structure'
      throw new Error(reasons)
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
    const ok = this.validateAchievement(updated)
    if (!ok) {
      const reasons =
        Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
          ? this._lastValidationReasons.join('; ')
          : 'Invalid achievement structure'
      throw new Error(reasons)
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
   * Validate profile structure per docs/02-Data-Model.md
   */
  validateProfile(profile) {
    if (!profile || typeof profile !== 'object') return false
    if (!profile.userId || typeof profile.userId !== 'string') return false
    if (typeof profile.displayName !== 'string') return false
    if (!Array.isArray(profile.unlockedMedals)) return false
    if (!Array.isArray(profile.prerequisites)) return false
    if (!this._isValidDob(profile.dateOfBirth)) return false

    if (!profile.sex || typeof profile.sex !== 'string') return false
    if (!VALID_PROFILE_SEX.includes(profile.sex)) return false

    // Optional features validation
    if (profile.features != null) {
      if (typeof profile.features !== 'object') return false
      if (
        'allowManualUnlock' in profile.features &&
        typeof profile.features.allowManualUnlock !== 'boolean'
      ) {
        return false
      }
      if (
        'enforceCurrentYearForSustained' in profile.features &&
        typeof profile.features.enforceCurrentYearForSustained !== 'boolean'
      ) {
        return false
      }
    }
    const age = this._computeAge(profile.dateOfBirth)
    if (age < 8 || age > 100) return false
    return true
  }

  /**
   * Validate achievement structure with minimal business rules
   */
  validateAchievement(achievement) {
    const reasons = []

    if (!achievement || typeof achievement !== 'object') {
      reasons.push('achievement must be an object')
    } else {
      if (!achievement.type || typeof achievement.type !== 'string') {
        reasons.push('type missing or not a string')
      }
      if (typeof achievement.year !== 'number' || Number.isNaN(achievement.year)) {
        reasons.push('year must be a finite number')
      }
      const wg = achievement.weaponGroup || ''
      if (!['A', 'B', 'C', 'R'].includes(wg)) {
        reasons.push(`weaponGroup must be one of A/B/C/R (got "${wg}")`)
      }

      // Type-specific checks
      if (achievement.type === 'precision_series') {
        if (typeof achievement.points !== 'number' || Number.isNaN(achievement.points)) {
          reasons.push('points must be a number')
        } else {
          if (achievement.points < 0 || achievement.points > 50) {
            reasons.push('points must be between 0 and 50')
          }
        }
      }

      if (achievement.type === 'application_series') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('date must be a valid ISO date')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('date cannot be in the future')
          }
        }
        if (
          typeof achievement.timeSeconds !== 'number' ||
          !Number.isFinite(achievement.timeSeconds) ||
          achievement.timeSeconds <= 0
        ) {
          reasons.push('timeSeconds must be a positive number')
        }
        if (
          typeof achievement.hits !== 'number' ||
          !Number.isFinite(achievement.hits) ||
          achievement.hits < 0
        ) {
          reasons.push('hits must be a non-negative number')
        }
      }

      if (achievement.type === 'competition_result') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('date must be a valid ISO date')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('date cannot be in the future')
          }
        }

        if (typeof achievement.score !== 'number' || !Number.isFinite(achievement.score)) {
          reasons.push('score must be a number')
        } else if (achievement.score < 0) {
          reasons.push('score must be >= 0')
        }

        const allowedDisciplines = ['national_whole_match', 'military_fast_match', 'ppc']
        const disc = String(achievement.disciplineType || '').toLowerCase()
        if (!allowedDisciplines.includes(disc)) {
          reasons.push(
            `disciplineType must be one of ${allowedDisciplines.join(', ')} (got "${disc || '(empty)'}")`
          )
        }

        if (disc === 'ppc') {
          const cls = achievement.ppcClass
          if (!cls || String(cls).trim() === '') {
            reasons.push('ppcClass is required when disciplineType is "ppc"')
          }
        }
      }

      if (achievement.type === 'running_shooting_course') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('date must be a valid ISO date')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('date cannot be in the future')
          }
        }
        if (
          typeof achievement.points !== 'number' ||
          !Number.isFinite(achievement.points) ||
          achievement.points < 0
        ) {
          reasons.push('points must be a non-negative number')
        }
      }
    }

    const ok = reasons.length === 0
    this._lastValidationReasons = reasons
    if (!ok) {
      try {
        console.groupCollapsed('[IndexedDBManager] validateAchievement failed')
        console.error('Reasons:', reasons)
        console.log('Achievement:', achievement)
        console.groupEnd()
      } catch {
        // ignore console errors
      }
    }
    return ok
  }

  _isValidDob(dob) {
    if (!dob || typeof dob !== 'string') return false
    // Must be basic ISO yyyy-mm-dd
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false
    const d = new Date(dob)
    if (Number.isNaN(d.getTime())) return false
    return true
  }

  _computeAge(dob) {
    if (!this._isValidDob(dob)) return NaN
    const d = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
    return age
  }

  _defaultDob() {
    // Reasonable default for migrated profiles; user can edit later
    return '2000-01-01'
  }

  _generateUserId() {
    try {
      if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
          return `user-${crypto.randomUUID()}`
        }
        if (typeof crypto.getRandomValues === 'function') {
          const bytes = new Uint8Array(16)
          crypto.getRandomValues(bytes)
          const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          return `user-${hex}`
        }
      }
    } catch {
      // ignore and fall through to non-cryptographic fallback
    }
    // Fallback: no cryptographic randomness available; use timestamp-based ID
    return `user-${Date.now()}`
  }

  async _ensureUniqueId(id) {
    const profiles = await this.getAllProfiles()
    const base = id && typeof id === 'string' && id.trim() ? id.trim() : this._generateUserId()
    let next = base
    let i = 1
    while (profiles.some((p) => p.userId === next)) {
      next = `${base}-${i++}`
    }
    return next
  }

  /**
   * Restore a full profile from a validated backup profile object.
   * strategy:
   *  - 'new-id' (default): always assign a fresh unique userId
   *  - 'overwrite': keep provided userId and overwrite existing profile with same id (or create if missing)
   */
  async restoreProfile(profile, { strategy = 'new-id' } = {}) {
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid profile')
    }

    const now = new Date().toISOString()
    const normalized = {
      userId: String(profile.userId || ''),
      displayName: String(profile.displayName || ''),
      createdDate: profile.createdDate || now,
      lastModified: now,
      dateOfBirth: profile.dateOfBirth || '',
      sex: profile.sex,
      unlockedMedals: Array.isArray(profile.unlockedMedals) ? profile.unlockedMedals : [],
      prerequisites: Array.isArray(profile.prerequisites) ? profile.prerequisites : [],
      notifications: !!profile.notifications,
      features: {
        ...DEFAULT_PROFILE_FEATURES,
        ...(profile.features
          ? {
              allowManualUnlock: !!profile.features.allowManualUnlock,
              enforceCurrentYearForSustained: !!profile.features.enforceCurrentYearForSustained,
            }
          : {}),
      },
    }

    if (strategy === 'new-id') {
      normalized.userId = await this._ensureUniqueId(this._generateUserId())
    } else if (strategy === 'overwrite') {
      if (!normalized.userId) throw new Error('userId is required for overwrite')
      // keep provided userId; overwrite if exists, or create if missing
    } else {
      throw new Error('Invalid restore strategy')
    }

    if (!this.validateProfile(normalized)) {
      throw new Error('Invalid profile structure')
    }

    await this.saveUserProfile(normalized)
    return normalized
  }

  /**
   * Get metadata value
   */
  async getMetadata(key) {
    const result = await this._transaction(STORES.METADATA, 'readonly', (store) => {
      return store.get(key)
    })
    return result?.value
  }

  /**
   * Set metadata value
   */
  async setMetadata(key, value) {
    return this._transaction(STORES.METADATA, 'readwrite', (store) => {
      return store.put({ key, value })
    })
  }

  /**
   * Execute transaction with error handling
   */
  async _transaction(storeName, mode, callback) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = callback(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)

        tx.onerror = () => reject(tx.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
