# PR-002: Data Layer & Storage System (React + Tailwind + Vite)

## DESCRIPTION
Implement the data persistence layer with localStorage support and a modular data manager interface. This enables user profiles to be created, saved, and loaded while integrating seamlessly with React's state management and keeping the door open for future backend API integration (per 05-Technical-Architecture.md).

## DEPENDENCIES
- PR-001: Project Setup & Medal Database (needs models.js and medals.json)

## ACCEPTANCE CRITERIA
- [ ] DataManager abstract interface defined with required methods
- [ ] LocalStorageDataManager fully implements DataManager
- [ ] User profiles save and load from localStorage without data loss
- [ ] Import/export JSON functionality works correctly
- [ ] Storage format matches schema in 02-Data-Model.md
- [ ] Data validation prevents invalid profiles from being saved
- [ ] React custom hooks for accessing storage functionality
- [ ] Unit tests verify save/load roundtrip with sample profiles
- [ ] Error handling for localStorage quota exceeded and corrupted data
- [ ] ProfileContext provides storage access to components
- [ ] Code structure follows 05-Technical-Architecture.md data layer design

## FILES TO CREATE
- src/data/dataManager.js (abstract interface)
- src/data/localStorage.js (localStorage implementation)
- src/logic/exporter.js (import/export functionality)
- src/contexts/ProfileContext.jsx (React context for profiles)
- src/hooks/useStorage.js (custom hook for storage operations)
- src/hooks/useProfile.js (custom hook for current profile)
- src/components/ProfileSelector.jsx (profile management UI)
- tests/storage.test.js (save/load verification)
- tests/exporter.test.js (import/export tests)

## CODE STRUCTURE

### src/data/dataManager.js

Abstract interface that all storage implementations must follow:

```javascript
/**
 * Abstract data manager interface
 * All storage implementations (localStorage, API, etc.) must implement these methods
 */
export class DataManager {
  // User Profile Operations
  async getUserProfile(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async saveUserProfile(profile) { 
    throw new Error('Not implemented'); 
  }
  
  async getAllProfiles() { 
    throw new Error('Not implemented'); 
  }
  
  async deleteProfile(userId) { 
    throw new Error('Not implemented'); 
  }
  
  // Achievement Operations
  async getAchievements(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async addAchievement(userId, achievement) { 
    throw new Error('Not implemented'); 
  }
  
  async updateAchievement(userId, achievementId, achievement) { 
    throw new Error('Not implemented'); 
  }
  
  async removeAchievement(userId, achievementId) { 
    throw new Error('Not implemented'); 
  }
  
  // Import/Export
  async exportData(userId) { 
    throw new Error('Not implemented'); 
  }
  
  async importData(jsonData) { 
    throw new Error('Not implemented'); 
  }
}
```

### src/data/localStorage.js

localStorage implementation per 02-Data-Model.md Storage Architecture:

```javascript
import { DataManager } from './dataManager'
import { UserProfile } from '../models/Profile'
import { Achievement } from '../models/Achievement'

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
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        version: '1.0',
        profiles: [],
        lastBackup: new Date().toISOString()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    const data = this.getStorageData()
    return data.profiles.find(p => p.userId === userId) || null
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
    profile.lastModified = new Date().toISOString()

    const index = data.profiles.findIndex(p => p.userId === profile.userId)
    if (index >= 0) {
      data.profiles[index] = profile
    } else {
      profile.createdDate = new Date().toISOString()
      data.profiles.push(profile)
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
    data.profiles = data.profiles.filter(p => p.userId !== userId)
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

    if (!achievement.id) {
      achievement.id = `achievement-${Date.now()}`
    }

    profile.prerequisites.push(achievement)
    await this.saveUserProfile(profile)
    return achievement
  }

  /**
   * Update existing achievement
   */
  async updateAchievement(userId, achievementId, achievement) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    const index = profile.prerequisites.findIndex(a => a.id === achievementId)
    if (index < 0) throw new Error('Achievement not found')

    profile.prerequisites[index] = { ...achievement, id: achievementId }
    await this.saveUserProfile(profile)
    return profile.prerequisites[index]
  }

  /**
   * Remove achievement from profile
   */
  async removeAchievement(userId, achievementId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    profile.prerequisites = profile.prerequisites.filter(a => a.id !== achievementId)
    await this.saveUserProfile(profile)
  }

  /**
   * Export profile data as JSON
   */
  async exportData(userId) {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('Profile not found')

    return {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      userProfile: {
        displayName: profile.displayName,
        weaponGroupPreference: profile.weaponGroupPreference,
        createdDate: profile.createdDate
      },
      achievements: profile.prerequisites || [],
      unlockedMedals: profile.unlockedMedals || []
    }
  }

  /**
   * Import profile data from JSON
   */
  async importData(jsonData) {
    const parsed = this.parseImportedJson(jsonData)
    
    const profile = new UserProfile({
      displayName: parsed.userProfile.displayName,
      weaponGroupPreference: parsed.userProfile.weaponGroupPreference,
      prerequisites: parsed.achievements || [],
      unlockedMedals: parsed.unlockedMedals || []
    })

    return await this.saveUserProfile(profile)
  }

  /**
   * Validate profile structure per 02-Data-Model.md
   */
  validateProfile(profile) {
    return profile.userId && 
           typeof profile.displayName === 'string' &&
           Array.isArray(profile.unlockedMedals) &&
           Array.isArray(profile.prerequisites)
  }

  /**
   * Validate achievement structure
   */
  validateAchievement(achievement) {
    return achievement.type && 
           achievement.year &&
           achievement.weaponGroup &&
           (achievement.points !== undefined || achievement.points !== null)
  }

  /**
   * Get raw storage data
   */
  getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to read storage:', error)
      throw new Error('Storage data corrupted')
    }
  }

  /**
   * Save raw storage data
   */
  saveStorageData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded')
      }
      throw error
    }
  }

  /**
   * Parse imported JSON
   */
  parseImportedJson(jsonString) {
    try {
      const data = JSON.parse(jsonString)
      
      if (!data.exportVersion) {
        throw new Error('Invalid export file: missing exportVersion')
      }
      
      if (!data.userProfile || !data.achievements || !Array.isArray(data.unlockedMedals)) {
        throw new Error('Invalid export file: missing required sections')
      }
      
      return data
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`)
    }
  }
}
```

### src/contexts/ProfileContext.jsx

```jsx
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

  // Load all profiles on mount
  React.useEffect(() => {
    loadProfiles()
  }, [])

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

  const createProfile = useCallback(async (displayName, weaponGroup = 'A') => {
    try {
      setLoading(true)
      const newProfile = new UserProfile({
        displayName,
        weaponGroupPreference: weaponGroup
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
  }, [storage, loadProfiles])

  const selectProfile = useCallback(async (userId) => {
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
  }, [storage])

  const updateProfile = useCallback(async (profile) => {
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
  }, [storage, loadProfiles])

  const deleteProfile = useCallback(async (userId) => {
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
  }, [storage, currentProfile, loadProfiles])

  const addAchievement = useCallback(async (achievement) => {
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
  }, [currentProfile, storage])

  const value = {
    currentProfile,
    profiles,
    loading,
    error,
    createProfile,
    selectProfile,
    updateProfile,
    deleteProfile,
    addAchievement
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
```

### src/hooks/useProfile.js

```javascript
import { useContext } from 'react'
import { ProfileContext } from '../contexts/ProfileContext'

/**
 * Custom hook to access profile operations
 */
export function useProfile() {
  const context = useContext(ProfileContext)
  
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  
  return context
}
```

### src/components/ProfileSelector.jsx

```jsx
import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

export default function ProfileSelector() {
  const {
    profiles,
    currentProfile,
    loading,
    createProfile,
    selectProfile,
    deleteProfile
  } = useProfile()

  const [showModal, setShowModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newWeaponGroup, setNewWeaponGroup] = useState('A')

  const handleCreateProfile = async (e) => {
    e.preventDefault()
    if (!newProfileName.trim()) return
    
    try {
      await createProfile(newProfileName, newWeaponGroup)
      setNewProfileName('')
      setShowModal(false)
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return
    try {
      await deleteProfile(userId)
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  return (
    <div>
      {!currentProfile ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700 mb-3">No profile selected</p>
          {profiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {profiles.map(profile => (
                <button
                  key={profile.userId}
                  onClick={() => selectProfile(profile.userId)}
                  className="w-full text-left px-4 py-2 bg-white border border-blue-200 rounded hover:bg-blue-50"
                >
                  {profile.displayName} (Group {profile.weaponGroupPreference})
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Profile
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700 font-semibold">
            Profile: {currentProfile.displayName}
          </p>
          <p className="text-green-600 text-sm">
            Weapon Group: {currentProfile.weaponGroupPreference}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create New Profile</h3>
            <form onSubmit={handleCreateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Weapon Group
                </label>
                <select
                  value={newWeaponGroup}
                  onChange={(e) => setNewWeaponGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled={loading}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

### tests/storage.test.js

```javascript
import { LocalStorageDataManager } from '../src/data/localStorage'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'

describe('LocalStorageDataManager', () => {
  let storage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageDataManager()
  })

  test('initializes storage on creation', () => {
    expect(localStorage.getItem('medal-app-data')).toBeTruthy()
  })

  test('saves profile to storage', async () => {
    const profile = new UserProfile({
      displayName: 'Test User',
      weaponGroupPreference: 'A'
    })
    
    const saved = await storage.saveUserProfile(profile)
    expect(saved.userId).toBe(profile.userId)
    expect(saved.lastModified).toBeDefined()
  })

  test('loads saved profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User'
    })
    
    await storage.saveUserProfile(profile)
    const loaded = await storage.getUserProfile(profile.userId)
    
    expect(loaded).toBeDefined()
    expect(loaded.displayName).toBe('Test User')
  })

  test('adds achievement to profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User'
    })
    await storage.saveUserProfile(profile)

    const achievement = new Achievement({
      type: 'gold_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    })

    await storage.addAchievement(profile.userId, achievement)
    const updated = await storage.getUserProfile(profile.userId)
    
    expect(updated.prerequisites.length).toBe(1)
  })

  test('deletes profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User'
    })
    await storage.saveUserProfile(profile)
    
    await storage.deleteProfile(profile.userId)
    const loaded = await storage.getUserProfile(profile.userId)
    
    expect(loaded).toBeNull()
  })

  test('validates profile before saving', async () => {
    const invalidProfile = { userId: null }
    
    await expect(storage.saveUserProfile(invalidProfile))
      .rejects
      .toThrow('Invalid profile structure')
  })
})
```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Storage Schema, User Profile, Achievement Object sections
- **05-Technical-Architecture.md** - Data Layer, DataManager interface design

## INTEGRATION NOTES
- DataManager is intentionally abstract so we can swap localStorage for an API later
- All async methods return Promises (ready for future API layer)
- Storage validates data before saving (prevent invalid states)
- Error messages are descriptive for user feedback
- ProfileContext provides easy access to all storage operations from React components

## DONE WHEN
- DataManager abstract class defined
- LocalStorageDataManager implements all required methods
- All CRUD operations work correctly
- Import/export functions round-trip data without loss
- ProfileContext provides storage access to all components
- React custom hooks working correctly
- All tests pass locally
- No console errors or warnings
