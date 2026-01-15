import { DataManager } from './dataManager'
import { UserProfile, DEFAULT_PROFILE_FEATURES, VALID_PROFILE_SEX } from '../models/Profile'

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
        version: '2.0',
        profiles: [],
        lastBackup: new Date().toISOString(),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
      return
    }

    // Migrate existing storage if needed
    try {
      const raw = localStorage.getItem(this.storageKey)
      const data = raw ? JSON.parse(raw) : null
      if (data && data.version !== '2.0') {
        const migrated = this._migrateToV2(data)
        this.saveStorageData(migrated)
      }
    } catch {
      // If parsing fails, reinitialize
      const initialData = {
        version: '2.0',
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
    const validation = this.validateProfile(profile)
    if (!validation.valid) {
      throw new Error(`Ogiltig profil: ${validation.errors.join(', ')}`)
    }
    // Normalize features (default to shared defaults when undefined)
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

    const data = this.getStorageData()
    const now = new Date().toISOString()
    profile.lastModified = now

    const index = data.profiles.findIndex((p) => p.userId === profile.userId)
    if (index >= 0) {
      // update
      data.profiles[index] = {
        ...data.profiles[index],
        ...profile,
        sex: profile.sex,
        features,
        userId: data.profiles[index].userId, // never change id
      }
    } else {
      // create
      const newProfile = {
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
   */
  async getAchievements(userId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) return []
    const changed = this._ensureAchievementIds(profile)
    if (changed) await this.saveUserProfile(profile)
    return profile ? (profile.prerequisites || []) : []
  }

  /**
   * Build a conservative natural key for matching (optional)
   */
  buildNaturalKey(ach) {
    const base = [ach.type, ach.year, ach.weaponGroup].map(v => String(v ?? '').trim().toLowerCase()).join('|')
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
  async upsertAchievements(userId, rows, { updateById = true, matchNaturalKey = false, addNew = true, dryRun = true } = {}) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')
    this._ensureAchievementIds(profile)

    const current = Array.isArray(profile.prerequisites) ? profile.prerequisites : []
    const byId = new Map(current.map(a => [a.id, a]))
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
          const reasonText = Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
            ? this._lastValidationReasons.join('; ')
            : 'Invalid achievement structure'
          console.groupCollapsed(`[LocalStorageDataManager] Validation failed for row #${i + 1}`)
          console.error('Reason:', reasonText)
          console.log('Record:', rec)
          console.groupEnd()
          result.failed++
          result.errors.push({ record: rec, row: i + 1, error: reasonText })
          continue
        }
      } catch (e) {
        console.groupCollapsed(`[LocalStorageDataManager] Exception validating row #${i + 1}`)
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
        console.debug('[LocalStorageDataManager] Matched by id', { row: i + 1, id: rec.id })
      } else if (matchNaturalKey) {
        const k = this.buildNaturalKey(rec)
        if (k) {
          if (byKey.has(k)) {
            console.debug('[LocalStorageDataManager] Matched by natural key', { row: i + 1, key: k })
            target = byKey.get(k)
          } else {
            console.debug('[LocalStorageDataManager] No match by natural key', { row: i + 1, key: k })
          }
        } else {
          console.debug('[LocalStorageDataManager] No natural key for record', { row: i + 1 })
        }
      }

      if (target) {
        const idx = next.findIndex(a => a.id === target.id)
        if (idx >= 0) {
          next[idx] = { ...rec, id: target.id }
          result.updated++
          console.info('[LocalStorageDataManager] Updated achievement', { row: i + 1, id: target.id })
        }
        continue
      }

      if (addNew) {
        const id = rec.id && !byId.has(rec.id) ? rec.id : `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        next.push({ ...rec, id })
        result.added++
        console.info('[LocalStorageDataManager] Added achievement', { row: i + 1, id })
      } else {
        result.skipped++
        console.info('[LocalStorageDataManager] Skipped (addNew=false)', { row: i + 1 })
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
      const reasons = Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
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
      const reasons = Array.isArray(this._lastValidationReasons) && this._lastValidationReasons.length
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
   * @param {object} profile - Profile to validate
   * @returns {{valid: boolean, errors: string[]}} Validation result with errors
   */
  validateProfile(profile) {
    const errors = []

    if (!profile || typeof profile !== 'object') {
      return { valid: false, errors: ['Profilen är ogiltig'] }
    }
    if (!profile.userId || typeof profile.userId !== 'string') {
      errors.push('Användar-ID saknas eller är ogiltigt')
    }
    if (typeof profile.displayName !== 'string') {
      errors.push('Profilnamn saknas')
    }
    if (!Array.isArray(profile.unlockedMedals)) {
      errors.push('Upplåsta medaljer måste vara en lista')
    }
    if (!Array.isArray(profile.prerequisites)) {
      errors.push('Förutsättningar måste vara en lista')
    }
    if (!this._isValidDob(profile.dateOfBirth)) {
      errors.push('Ogiltigt födelsedatum (måste vara ÅÅÅÅ-MM-DD)')
    }

    if (!profile.sex || typeof profile.sex !== 'string') {
      errors.push('Kön saknas')
    } else if (!VALID_PROFILE_SEX.includes(profile.sex)) {
      errors.push('Ogiltigt kön (måste vara "male" eller "female")')
    }

    // Optional features validation
    if (profile.features != null) {
      if (typeof profile.features !== 'object') {
        errors.push('Funktioner måste vara ett objekt')
      } else {
        if ('allowManualUnlock' in profile.features && typeof profile.features.allowManualUnlock !== 'boolean') {
          errors.push('allowManualUnlock måste vara sant eller falskt')
        }
        if ('enforceCurrentYearForSustained' in profile.features && typeof profile.features.enforceCurrentYearForSustained !== 'boolean') {
          errors.push('enforceCurrentYearForSustained måste vara sant eller falskt')
        }
      }
    }

    // Only check age if DOB is valid
    if (this._isValidDob(profile.dateOfBirth)) {
      const age = this._computeAge(profile.dateOfBirth)
      if (age < 8) {
        errors.push(`Åldern måste vara minst 8 år (beräknad ålder: ${age})`)
      } else if (age > 100) {
        errors.push(`Åldern får inte överstiga 100 år (beräknad ålder: ${age})`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate achievement structure with minimal business rules
   */
  validateAchievement(achievement) {
    const reasons = []

    if (!achievement || typeof achievement !== 'object') {
      reasons.push('Aktiviteten måste vara ett objekt')
    } else {
      if (!achievement.type || typeof achievement.type !== 'string') {
        reasons.push('Typ saknas eller är ogiltig')
      }
      if (typeof achievement.year !== 'number' || Number.isNaN(achievement.year)) {
        reasons.push('År måste vara ett tal')
      }
      const wg = achievement.weaponGroup || ''
      if (!['A', 'B', 'C', 'R'].includes(wg)) {
        reasons.push(`Vapengrupp måste vara A, B, C eller R (fick "${wg}")`)
      }

      // Type-specific checks
      if (achievement.type === 'precision_series') {
        if (typeof achievement.points !== 'number' || Number.isNaN(achievement.points)) {
          reasons.push('Poäng måste vara ett tal')
        } else {
          if (achievement.points < 0 || achievement.points > 50) {
            reasons.push('Poäng måste vara mellan 0 och 50')
          }
        }
      }

      if (achievement.type === 'application_series') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('Datum måste vara ett giltigt ISO-datum (ÅÅÅÅ-MM-DD)')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('Datum får inte vara i framtiden')
          }
        }
        if (typeof achievement.timeSeconds !== 'number' || !Number.isFinite(achievement.timeSeconds) || achievement.timeSeconds <= 0) {
          reasons.push('Tid (sekunder) måste vara ett positivt tal')
        }
        if (typeof achievement.hits !== 'number' || !Number.isFinite(achievement.hits) || achievement.hits < 0) {
          reasons.push('Träffar måste vara ett icke-negativt tal')
        }
      }

      if (achievement.type === 'competition_result') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('Datum måste vara ett giltigt ISO-datum (ÅÅÅÅ-MM-DD)')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('Datum får inte vara i framtiden')
          }
        }

        if (typeof achievement.score !== 'number' || !Number.isFinite(achievement.score)) {
          reasons.push('Resultat måste vara ett tal')
        } else if (achievement.score < 0) {
          reasons.push('Resultat måste vara >= 0')
        }

        const allowedDisciplines = ['national_whole_match', 'military_fast_match', 'ppc']
        const disc = String(achievement.disciplineType || '').toLowerCase()
        if (!allowedDisciplines.includes(disc)) {
          reasons.push(`Disciplin måste vara national_whole_match, military_fast_match eller ppc (fick "${disc || '(tom)'}")`)
        }

        if (disc === 'ppc') {
          const cls = achievement.ppcClass
          if (!cls || String(cls).trim() === '') {
            reasons.push('PPC-klass krävs när disciplin är "ppc"')
          }
        }
      }

      if (achievement.type === 'running_shooting_course') {
        if (!achievement.date || Number.isNaN(new Date(achievement.date).getTime())) {
          reasons.push('Datum måste vara ett giltigt ISO-datum (ÅÅÅÅ-MM-DD)')
        } else {
          const d = new Date(achievement.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          d.setHours(0, 0, 0, 0)
          if (d.getTime() > today.getTime()) {
            reasons.push('Datum får inte vara i framtiden')
          }
        }
        if (typeof achievement.points !== 'number' || !Number.isFinite(achievement.points) || achievement.points < 0) {
          reasons.push('Poäng måste vara ett icke-negativt tal')
        }
      }
    }

    const ok = reasons.length === 0
    this._lastValidationReasons = reasons
    if (!ok) {
      try {
        console.groupCollapsed('[LocalStorageDataManager] validateAchievement failed')
        console.error('Reasons:', reasons)
        console.log('Achievement:', achievement)
        console.groupEnd()
      } catch {
        // ignore console errors
      }
    }
    return ok
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

  _migrateToV2(data) {
    const next = { ...data }
    next.version = '2.0'
    next.profiles = Array.isArray(data.profiles) ? data.profiles.map(p => {
      const copy = { ...p }
      delete copy.weaponGroupPreference
      if (!this._isValidDob(copy.dateOfBirth)) {
        copy.dateOfBirth = this._defaultDob()
      }
      if (!copy.features) {
        copy.features = { ...DEFAULT_PROFILE_FEATURES }
      } else {
        if (typeof copy.features.allowManualUnlock !== 'boolean') copy.features.allowManualUnlock = DEFAULT_PROFILE_FEATURES.allowManualUnlock
        if (typeof copy.features.enforceCurrentYearForSustained !== 'boolean') copy.features.enforceCurrentYearForSustained = DEFAULT_PROFILE_FEATURES.enforceCurrentYearForSustained
      }
      copy.lastModified = new Date().toISOString()
      return copy
    }) : []
    return next
  }

  _hasStorage() {
    try {
      return typeof localStorage !== 'undefined'
    } catch {
      return false
    }
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
            .map(b => b.toString(16).padStart(2, '0'))
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

  _ensureUniqueId(id) {
    const data = this.getStorageData()
    const base = id && typeof id === 'string' && id.trim() ? id.trim() : this._generateUserId()
    let next = base
    let i = 1
    while (data.profiles.some(p => p.userId === next)) {
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
      normalized.userId = this._ensureUniqueId(this._generateUserId())
    } else if (strategy === 'overwrite') {
      if (!normalized.userId) throw new Error('userId is required for overwrite')
      // keep provided userId; overwrite if exists, or create if missing
    } else {
      throw new Error('Invalid restore strategy')
    }

    const validation = this.validateProfile(normalized)
    if (!validation.valid) {
      throw new Error(`Ogiltig profil: ${validation.errors.join(', ')}`)
    }

    const data = this.getStorageData()
    const idx = data.profiles.findIndex(p => p.userId === normalized.userId)
    if (idx >= 0) {
      data.profiles[idx] = normalized
    } else {
      data.profiles.push(normalized)
    }
    this.saveStorageData(data)
    return normalized
  }
}
