import React, { useState, useCallback, useEffect } from 'react'
import { ProfileContext } from './profileContext.js'
import { LocalStorageDataManager } from '../data/localStorage'
import { UserProfile } from '../models/Profile'
import { parseProfileBackup } from '../utils/importManager'

const ONBOARDING_KEY = 'app:onboardingChoice'

const LAST_PROFILE_KEY = 'app:lastProfileId'

function getLastProfileId() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_PROFILE_KEY)
  } catch {
    return null
  }
}

function setLastProfileId(id) {
  if (typeof window === 'undefined') return
  try {
    if (id) {
      window.localStorage.setItem(LAST_PROFILE_KEY, id)
    } else {
      window.localStorage.removeItem(LAST_PROFILE_KEY)
    }
  } catch {
    // ignore
  }
}

function getProfileOverrideFromURL() {
  if (typeof window === 'undefined') return null
  try {
    const url = new URL(window.location.href)
    const id = url.searchParams.get('profile')
    return id || null
  } catch {
    return null
  }
}

function createGuestProfile({ sex }) {
  return new UserProfile({
    userId: 'guest',
    displayName: 'Gästläge',
    // Use a stable local date so getFullYear() is 1975 in all timezones
    dateOfBirth: '1975-01-02',
    sex,
    unlockedMedals: [],
    prerequisites: [],
    isGuest: true,
  })
}

export function ProfileProvider({ children }) {
  const [storage] = useState(() => new LocalStorageDataManager())
  const [currentProfile, setCurrentProfile] = useState(undefined)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true)
      const allProfiles = await storage.getAllProfiles()
      setProfiles(allProfiles)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Failed to load profiles:', err)
    } finally {
      setLoading(false)
    }
  }, [storage])

  const startExplorerMode = useCallback((sex) => {
    try { window.localStorage.setItem(ONBOARDING_KEY, 'guest') } catch (e) { void e }
    setCurrentProfile(createGuestProfile({ sex }))
  }, [])

  // Bootstrap: load profiles, decide initial profile, then mark hydrated
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const allProfiles = await storage.getAllProfiles()
        if (cancelled) return
        setProfiles(allProfiles)

        let selected = null
        const overrideId = getProfileOverrideFromURL()
        if (overrideId && allProfiles.some(p => p.userId === overrideId)) {
          selected = allProfiles.find(p => p.userId === overrideId) || null
          setLastProfileId(overrideId)
        } else {
          const lastId = getLastProfileId()
          if (lastId && allProfiles.some(p => p.userId === lastId)) {
            selected = allProfiles.find(p => p.userId === lastId) || null
          } else if (allProfiles.length > 0) {
            selected = [...allProfiles].sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0]
          } else {
            // No implicit guest profile anymore; user must explicitly create/select with required fields.
            try {
              const choice = window.localStorage.getItem(ONBOARDING_KEY)
              if (choice === 'guest') {
                // keep null; UI must prompt for required sex before starting guest mode
                selected = null
              }
            } catch (e) { void e }
          }
        }

        setCurrentProfile(selected ?? null)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          console.error('Failed to bootstrap profiles:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHydrated(true)
        }
      }
    })()
    return () => { let _ = (cancelled = true) }
  }, [storage])

  const createProfile = useCallback(
    async (displayName, dateOfBirth, sex) => {
      try {
        setLoading(true)
        const newProfile = new UserProfile({
          displayName,
          dateOfBirth,
          sex,
        })
        const saved = await storage.saveUserProfile(newProfile)
        setCurrentProfile(saved)
        setLastProfileId(saved.userId)
        await loadProfiles()
        return saved
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [storage, loadProfiles]
  )

  const selectProfile = useCallback(
    async (userId) => {
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(userId)
        if (!profile) throw new Error('Profile not found')
        setCurrentProfile(profile)
        setLastProfileId(profile.userId)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [storage]
  )

  // Clear onboarding guest choice when a non-guest profile is active
  useEffect(() => {
    if (!hydrated) return
    if (currentProfile && !currentProfile.isGuest) {
      try { window.localStorage.removeItem(ONBOARDING_KEY) } catch (e) { void e }
    }
  }, [currentProfile, hydrated])

  const updateProfile = useCallback(
    async (profile) => {
      try {
        setLoading(true)
        const updated = await storage.saveUserProfile(profile)
        setCurrentProfile(updated)
        setLastProfileId(updated.userId)
        await loadProfiles()
        return updated
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [storage, loadProfiles]
  )

  const deleteProfile = useCallback(
    async (userId) => {
      try {
        setLoading(true)
        await storage.deleteProfile(userId)
        if (currentProfile?.userId === userId) {
          setCurrentProfile(null)
          setLastProfileId(null)
        }
        await loadProfiles()
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [storage, currentProfile, loadProfiles]
  )

  const addAchievement = useCallback(
    async (achievement) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => ({
          ...p,
          prerequisites: [...(p?.prerequisites || []), achievement],
          lastModified: new Date().toISOString(),
        }))
        return achievement
      }
      try {
        setLoading(true)
        const saved = await storage.addAchievement(currentProfile.userId, achievement)
        // Reload current profile
        const updated = await storage.getUserProfile(currentProfile.userId)
        setCurrentProfile(updated)
        return saved
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const updateAchievement = useCallback(
    async (updatedAchievement) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (!updatedAchievement?.id) throw new Error('Achievement id is required')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => {
          const list = Array.isArray(p?.prerequisites) ? [...p.prerequisites] : []
          const idx = list.findIndex(a => a.id === updatedAchievement.id)
          if (idx !== -1) list[idx] = { ...list[idx], ...updatedAchievement }
          return { ...p, prerequisites: list, lastModified: new Date().toISOString() }
        })
        return updatedAchievement
      }
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(currentProfile.userId)
        const list = Array.isArray(profile.prerequisites) ? [...profile.prerequisites] : []
        const idx = list.findIndex(a => a.id === updatedAchievement.id)
        if (idx === -1) throw new Error('Achievement not found')
        list[idx] = { ...list[idx], ...updatedAchievement }
        const nextProfile = { ...profile, prerequisites: list, lastModified: new Date().toISOString() }
        const saved = await storage.saveUserProfile(nextProfile)
        setCurrentProfile(saved)
        return saved.prerequisites[idx]
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const removeAchievement = useCallback(
    async (achievementId) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (!achievementId) throw new Error('Achievement id is required')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => ({
          ...p,
          prerequisites: (p?.prerequisites || []).filter(a => a.id !== achievementId),
          lastModified: new Date().toISOString(),
        }))
        return true
      }
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(currentProfile.userId)
        const list = Array.isArray(profile.prerequisites) ? profile.prerequisites.filter(a => a.id !== achievementId) : []
        const nextProfile = { ...profile, prerequisites: list, lastModified: new Date().toISOString() }
        const saved = await storage.saveUserProfile(nextProfile)
        setCurrentProfile(saved)
        return true
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const unlockMedal = useCallback(
    async (medalId, unlockedDate) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (!medalId) throw new Error('medalId is required')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => {
          const list = Array.isArray(p?.unlockedMedals) ? [...p.unlockedMedals] : []
          if (list.some(m => m.medalId === medalId)) {
            return p
          }
          const entry = {
            medalId,
            unlockedDate: unlockedDate || new Date().toISOString().slice(0, 10),
          }
          return {
            ...p,
            unlockedMedals: [...list, entry],
            lastModified: new Date().toISOString(),
          }
        })
        return true
      }
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(currentProfile.userId)
        const list = Array.isArray(profile.unlockedMedals) ? [...profile.unlockedMedals] : []
        if (list.some(m => m.medalId === medalId)) {
          // Already unlocked; no changes necessary
          return false
        }
        const entry = {
          medalId,
          unlockedDate: unlockedDate || new Date().toISOString().slice(0, 10),
        }
        const nextProfile = { ...profile, unlockedMedals: [...list, entry], lastModified: new Date().toISOString() }
        const saved = await storage.saveUserProfile(nextProfile)
        setCurrentProfile(saved)
        return true
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const lockMedal = useCallback(
    async (medalId) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (!medalId) throw new Error('medalId is required')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => ({
          ...p,
          unlockedMedals: (p?.unlockedMedals || []).filter(m => m.medalId !== medalId),
          lastModified: new Date().toISOString(),
        }))
        return true
      }
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(currentProfile.userId)
        const list = Array.isArray(profile.unlockedMedals) ? profile.unlockedMedals : []
        const nextList = list.filter(m => m.medalId !== medalId)
        if (nextList.length === list.length) {
          // Nothing to remove
          return false
        }
        const nextProfile = { ...profile, unlockedMedals: nextList, lastModified: new Date().toISOString() }
        const saved = await storage.saveUserProfile(nextProfile)
        setCurrentProfile(saved)
        return true
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const setProfileFeature = useCallback(
    async (name, value) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (!name) throw new Error('Feature name is required')
      if (currentProfile.isGuest) {
        setCurrentProfile(p => ({
          ...p,
          features: { ...(p?.features || {}), [name]: !!value },
          lastModified: new Date().toISOString(),
        }))
        setError(null)
        return currentProfile
      }
      try {
        setLoading(true)
        const profile = await storage.getUserProfile(currentProfile.userId)
        const features = { ...(profile.features || {}), [name]: !!value }
        const nextProfile = { ...profile, features, lastModified: new Date().toISOString() }
        const saved = await storage.saveUserProfile(nextProfile)
        setCurrentProfile(saved)
        setError(null)
        return saved
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage]
  )

  const restoreProfileFromBackup = useCallback(
    async (jsonOrObj, options = { strategy: 'new-id' }) => {
      try {
        setLoading(true)
        const parsed = parseProfileBackup(jsonOrObj)
        const saved = await storage.restoreProfile(parsed, options)
        setCurrentProfile(saved)
        setLastProfileId(saved.userId)
        await loadProfiles()
        setError(null)
        return saved
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [storage, loadProfiles]
  )

  const upsertAchievements = useCallback(
    async (rows, options) => {
      if (!currentProfile) throw new Error('No profile selected')
      if (currentProfile.isGuest) {
        if (!options?.dryRun) {
          setCurrentProfile(p => ({
            ...p,
            prerequisites: Array.isArray(p?.prerequisites) ? [...rows] : [...rows],
            lastModified: new Date().toISOString(),
          }))
        }
        setError(null)
        return { added: rows?.length || 0, updated: 0, duplicates: 0 }
      }
      try {
        setLoading(true)
        const result = await storage.upsertAchievements(currentProfile.userId, rows, options)
        if (!options?.dryRun) {
          const updated = await storage.getUserProfile(currentProfile.userId)
          setCurrentProfile(updated)
          setLastProfileId(updated.userId)
          await loadProfiles()
        }
        setError(null)
        return result
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentProfile, storage, loadProfiles]
  )

  const convertGuestToSaved = useCallback(
    async (displayName, dateOfBirth = '', sex) => {
      if (!currentProfile?.isGuest) return null
      const saved = new UserProfile({
        ...currentProfile,
        userId: undefined,
        displayName: displayName || 'Profil',
        dateOfBirth,
        sex,
        isGuest: false,
      })
      const persisted = await storage.saveUserProfile(saved)
      setCurrentProfile(persisted)
      setLastProfileId(persisted.userId)
      await loadProfiles()
      return persisted
    },
    [currentProfile, storage, loadProfiles]
  )

  const resetCurrentProfileData = useCallback(
    async () => {
      if (!currentProfile) return false
      const cleared = {
        ...currentProfile,
        unlockedMedals: [],
        prerequisites: [],
        lastModified: new Date().toISOString(),
      }
      if (currentProfile.isGuest) {
        setCurrentProfile(cleared)
        return true
      }
      const saved = await storage.saveUserProfile(cleared)
      setCurrentProfile(saved)
      await loadProfiles()
      return true
    },
    [currentProfile, storage, loadProfiles]
  )

  const value = {
    currentProfile,
    profiles,
    loading,
    hydrated,
    error,
    createProfile,
    selectProfile,
    updateProfile,
    deleteProfile,
    addAchievement,
    updateAchievement,
    removeAchievement,
    unlockMedal,
    lockMedal,
    setProfileFeature,
    restoreProfileFromBackup,
    upsertAchievements,
    startExplorerMode,
    convertGuestToSaved,
    resetCurrentProfileData,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
