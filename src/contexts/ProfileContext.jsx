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
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
