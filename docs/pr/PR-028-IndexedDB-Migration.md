# PR-028: IndexedDB Migration

## Overview

**Phase**: 2 of 6 (Backup Improvements Roadmap)
**Priority**: HIGH 🔥
**Effort**: 4-5 days
**Impact**: More reliable storage, 10x capacity increase, future-proofing

Migrates from localStorage (5-10MB limit) to IndexedDB (50MB+ capacity) while maintaining backward compatibility and subfolder isolation.

## Problem Statement

```
Current State (localStorage):
├─ Capacity: 5-10MB (browser-dependent)
├─ Cleared easily (browser settings, private mode)
├─ Synchronous API (blocks UI)
├─ No transaction support
├─ Quota exceeded errors for large profiles
└─ Users lose data when browser cleared

Result: Data loss reports, storage limit complaints
```

## Solution: IndexedDB with localStorage Fallback

```
After PR-028:
├─ Capacity: 50MB+ (expandable to GB)
├─ Persistent (survives browser cleanup better)
├─ Asynchronous API (non-blocking)
├─ Transaction support
├─ Auto-migration from localStorage
├─ localStorage fallback if IndexedDB unavailable
└─ Maintains prod/test subfolder isolation

Result: 0 storage limit errors, better data retention
```

## DESCRIPTION

### What This PR Does

Creates a transparent IndexedDB storage layer while maintaining the existing DataManager interface. Features:

1. **IndexedDBManager Class**
   - Implements DataManager interface
   - Async/await API
   - Object stores for profiles, settings, metadata

2. **Auto-Migration**
   - Detects localStorage data on first load
   - Migrates to IndexedDB automatically
   - Keeps localStorage as backup
   - Shows progress to user

3. **Graceful Fallback**
   - Feature detection for IndexedDB
   - Falls back to localStorage if unavailable
   - No UI changes (invisible to user)

4. **Subfolder Isolation**
   - Database name includes subfolder path
   - Prod and test data remain separate
   - No cross-contamination

5. **Backward Compatibility**
   - All existing code continues working
   - DataManager interface unchanged
   - ProfileContext unmodified

## Current Implementation Reference

**Existing Files**:
- `/src/data/dataManager.js:1` - Abstract interface
- `/src/data/localStorage.js:1` - Current implementation
- `/src/hooks/useStorage.js:1` - Storage hook
- `/src/contexts/ProfileContext.jsx:1` - Uses DataManager

**Current DataManager Interface**:
```javascript
class DataManager {
  async init() {}
  async getProfiles() {}
  async saveProfile(profile) {}
  async deleteProfile(userId) {}
  async updateProfile(userId, updates) {}
  // ... etc
}
```

## Files to Create/Modify

### NEW Files

```
src/data/indexedDBManager.js
├─ IndexedDBManager class
├─ DB schema definition
├─ Transaction helpers
└─ Error handling

src/data/migrationManager.js
├─ detectStorageType()
├─ migrateFromLocalStorage()
├─ verifyMigration()
└─ Migration progress tracking

src/utils/storageDetection.js
├─ isIndexedDBAvailable()
├─ isLocalStorageAvailable()
├─ getBrowserStorageQuota()
└─ Storage feature detection

src/components/MigrationProgress.jsx (optional)
├─ Shows migration status
├─ Progress bar
└─ Dismissible after complete
```

### MODIFIED Files

```
src/hooks/useStorage.js
├─ Auto-detect storage type
├─ Use IndexedDBManager if available
└─ Fallback to LocalStorageDataManager

src/contexts/ProfileContext.jsx (minimal changes)
└─ Handle async initialization

src/App.jsx (minimal changes)
└─ Show MigrationProgress if migrating
```

## CODE STRUCTURE

### indexedDBManager.js (NEW)

```javascript
// src/data/indexedDBManager.js

import { DataManager } from './dataManager'

const DB_NAME_PREFIX = 'medal-app'
const DB_VERSION = 1
const STORES = {
  PROFILES: 'profiles',
  METADATA: 'metadata'
}

/**
 * IndexedDB implementation of DataManager
 * Async/await API with transaction support
 */
export class IndexedDBManager extends DataManager {
  constructor() {
    super()
    this.db = null
    this.dbName = this._generateDBName()
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
   * Initialize IndexedDB connection
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
            keyPath: 'userId'
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
   * Get all profiles
   */
  async getProfiles() {
    return this._transaction(STORES.PROFILES, 'readonly', (store) => {
      return store.getAll()
    })
  }

  /**
   * Save a profile
   */
  async saveProfile(profile) {
    return this._transaction(STORES.PROFILES, 'readwrite', (store) => {
      return store.put(profile)
    })
  }

  /**
   * Delete a profile
   */
  async deleteProfile(userId) {
    return this._transaction(STORES.PROFILES, 'readwrite', (store) => {
      return store.delete(userId)
    })
  }

  /**
   * Update profile fields
   */
  async updateProfile(userId, updates) {
    const profile = await this.getProfile(userId)
    if (!profile) {
      throw new Error(`Profile not found: ${userId}`)
    }

    const updated = {
      ...profile,
      ...updates,
      lastModified: new Date().toISOString()
    }

    return this.saveProfile(updated)
  }

  /**
   * Get single profile by ID
   */
  async getProfile(userId) {
    return this._transaction(STORES.PROFILES, 'readonly', (store) => {
      return store.get(userId)
    })
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
```

### migrationManager.js (NEW)

```javascript
// src/data/migrationManager.js

import { IndexedDBManager } from './indexedDBManager'
import { LocalStorageDataManager } from './localStorage'

/**
 * Detect which storage type is currently in use
 */
export async function detectStorageType() {
  // Check localStorage for existing data
  const hasLocalStorageData = localStorage.getItem('medal-app-data') !== null

  // Check IndexedDB for existing data
  const hasIndexedDBData = await checkIndexedDBData()

  if (hasIndexedDBData) return 'indexeddb'
  if (hasLocalStorageData) return 'localstorage'
  return 'none' // New user
}

/**
 * Check if IndexedDB has data
 */
async function checkIndexedDBData() {
  try {
    const manager = new IndexedDBManager()
    await manager.init()
    const profiles = await manager.getProfiles()
    manager.close()
    return profiles && profiles.length > 0
  } catch {
    return false
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(onProgress) {
  try {
    onProgress?.({ stage: 'loading', percent: 0 })

    // Load from localStorage
    const localManager = new LocalStorageDataManager()
    await localManager.init()
    const profiles = await localManager.getProfiles()

    onProgress?.({ stage: 'saving', percent: 33 })

    // Save to IndexedDB
    const idbManager = new IndexedDBManager()
    await idbManager.init()

    for (let i = 0; i < profiles.length; i++) {
      await idbManager.saveProfile(profiles[i])
      onProgress?.({
        stage: 'saving',
        percent: 33 + ((i + 1) / profiles.length) * 34
      })
    }

    // Mark migration complete
    await idbManager.setMetadata('migration_complete', true)
    await idbManager.setMetadata('migration_date', new Date().toISOString())
    await idbManager.setMetadata('migrated_from', 'localstorage')

    onProgress?.({ stage: 'verifying', percent: 75 })

    // Verify migration
    const migratedProfiles = await idbManager.getProfiles()
    if (migratedProfiles.length !== profiles.length) {
      throw new Error('Migration verification failed: profile count mismatch')
    }

    onProgress?.({ stage: 'complete', percent: 100 })

    return {
      success: true,
      profilesMigrated: profiles.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verify migration was successful
 */
export async function verifyMigration() {
  try {
    const idbManager = new IndexedDBManager()
    await idbManager.init()

    const migrationComplete = await idbManager.getMetadata('migration_complete')
    const profiles = await idbManager.getProfiles()

    idbManager.close()

    return {
      complete: !!migrationComplete,
      profileCount: profiles.length
    }
  } catch {
    return {
      complete: false,
      profileCount: 0
    }
  }
}
```

### Enhanced useStorage.js

```javascript
// src/hooks/useStorage.js (MODIFIED)

import { useMemo, useEffect, useState } from 'react'
import { IndexedDBManager } from '../data/indexedDBManager'
import { LocalStorageDataManager } from '../data/localStorage'
import { isIndexedDBAvailable } from '../utils/storageDetection'
import { detectStorageType, migrateFromLocalStorage } from '../data/migrationManager'

/**
 * Hook providing appropriate storage manager
 * Automatically migrates from localStorage to IndexedDB
 */
export default function useStorage() {
  const [manager, setManager] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(null)

  useEffect(() => {
    async function initStorage() {
      // Feature detection
      const hasIndexedDB = isIndexedDBAvailable()
      const storageType = await detectStorageType()

      // New user or already on IndexedDB
      if (storageType === 'none' || storageType === 'indexeddb') {
        if (hasIndexedDB) {
          const idbManager = new IndexedDBManager()
          await idbManager.init()
          setManager(idbManager)
        } else {
          // Fallback to localStorage
          const localManager = new LocalStorageDataManager()
          await localManager.init()
          setManager(localManager)
        }
        return
      }

      // Has localStorage data, needs migration
      if (storageType === 'localstorage' && hasIndexedDB) {
        setMigrating(true)

        const result = await migrateFromLocalStorage((progress) => {
          setMigrationProgress(progress)
        })

        setMigrating(false)

        if (result.success) {
          const idbManager = new IndexedDBManager()
          await idbManager.init()
          setManager(idbManager)
        } else {
          // Migration failed, use localStorage
          console.error('Migration failed:', result.error)
          const localManager = new LocalStorageDataManager()
          await localManager.init()
          setManager(localManager)
        }
      } else {
        // No IndexedDB support, use localStorage
        const localManager = new LocalStorageDataManager()
        await localManager.init()
        setManager(localManager)
      }
    }

    initStorage()
  }, [])

  return { manager, migrating, migrationProgress }
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] IndexedDBManager implements DataManager interface
- [ ] Auto-migration from localStorage works
- [ ] Migration preserves all profile data
- [ ] Subfolder isolation maintained (prod/test separate)
- [ ] Fallback to localStorage if IndexedDB unavailable
- [ ] Existing code works without modification
- [ ] No data loss during migration

### Storage Requirements
- [ ] Capacity increases to 50MB+
- [ ] Transaction support working
- [ ] Async operations non-blocking
- [ ] Database versioning supports future upgrades
- [ ] Metadata store for app settings

### Migration Requirements
- [ ] Detects localStorage data automatically
- [ ] Shows migration progress to user (optional)
- [ ] Verifies migration success
- [ ] Marks migration complete
- [ ] Keeps localStorage as backup (optional)

### Performance Requirements
- [ ] Init time <500ms
- [ ] Profile load <100ms
- [ ] Profile save <200ms
- [ ] Migration <2 seconds (100 profiles)

### Error Handling
- [ ] Graceful failure to localStorage
- [ ] Clear error messages
- [ ] Migration rollback if needed
- [ ] Database corruption detection

### Testing Requirements
- [ ] 50+ unit tests for IndexedDBManager
- [ ] 20+ tests for migration
- [ ] Integration tests with ProfileContext
- [ ] Browser compatibility tests
- [ ] Manual migration testing

## DESIGN REFERENCES

**Related Documents:**
- [ROADMAP-BACKUP-IMPROVEMENTS.md](./ROADMAP-BACKUP-IMPROVEMENTS.md) - Overall roadmap
- [05-Technical-Architecture.md](/docs/05-Technical-Architecture.md) - Architecture

**Key Design Principles:**
```
1. Transparent Migration
   └─ Invisible to user, automatic

2. Backward Compatible
   └─ All existing code works

3. Graceful Degradation
   └─ Falls back to localStorage

4. Data Safety
   └─ Verify before completing migration

5. Subfolder Isolation
   └─ Prod/test data separate
```

## DONE WHEN

- [ ] IndexedDBManager created and tested
- [ ] MigrationManager created and tested
- [ ] useStorage hook updated
- [ ] Auto-migration working
- [ ] 50+ tests passing
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Manual testing: fresh install → localStorage migration
- [ ] Manual testing: subfolder isolation
- [ ] Performance benchmarks met
- [ ] Code review passed
- [ ] Merged to main

## Success Metrics

```
Before PR-028 (localStorage):
├─ Capacity: 5-10MB
├─ Data loss: Common
├─ Storage errors: Frequent
└─ Persistence: Poor

After PR-028 (IndexedDB):
├─ Capacity: 50MB+
├─ Data loss: Rare
├─ Storage errors: None
└─ Persistence: Excellent ✨
```

---

**Priority**: HIGH 🔥
**Dependencies**: PR-027 (recommended, not required)
**Start Date**: Week 2 Monday
**Target Completion**: Week 2 Friday (4-5 days)
**Next PR**: [PR-032: Data Integrity](./PR-032-Data-Integrity.md) (recommended) or [PR-029: Backup Reminders](./PR-029-Backup-Reminders.md)
