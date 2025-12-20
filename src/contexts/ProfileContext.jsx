import React, { createContext, useState, useCallback } from 'react'
import { LocalStorageDataManager } from '../data/localStorage'
import { UserProfile } from '../models/Profile'

export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [storage] = useState(() => new LocalStorageDataManager())
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  // Load all profiles on mount
  React.useEffect(() => {
    loadProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createProfile = useCallback(
    async (displayName, weaponGroup = 'A') => {
      try {
        setLoading(true)
        const newProfile = new UserProfile({
          displayName,
          weaponGroupPreference: weaponGroup,
        })
        const saved = await storage.saveUserProfile(newProfile)
        setCurrentProfile(saved)
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
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [storage]
  )

  const updateProfile = useCallback(
    async (profile) => {
      try {
        setLoading(true)
        const updated = await storage.saveUserProfile(profile)
        setCurrentProfile(updated)
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

  const value = {
    currentProfile,
    profiles,
    loading,
    error,
    createProfile,
    selectProfile,
    updateProfile,
    deleteProfile,
    addAchievement,
    updateAchievement,
    removeAchievement,
    unlockMedal,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
