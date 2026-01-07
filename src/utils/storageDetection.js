/**
 * Storage feature detection utilities
 * Detects IndexedDB and localStorage availability
 */

/**
 * Check if IndexedDB is available in the current environment
 * @returns {boolean}
 */
export function isIndexedDBAvailable() {
  try {
    // Check if indexedDB exists
    if (typeof indexedDB === 'undefined' || !indexedDB) {
      return false
    }

    // Basic check - if we can access indexedDB.open, it's likely available
    if (typeof indexedDB.open !== 'function') {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Check if localStorage is available in the current environment
 * @returns {boolean}
 */
export function isLocalStorageAvailable() {
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    // Try to use localStorage (blocked in some privacy modes)
    const testKey = '_ls_test_'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get browser storage quota information
 * @returns {Promise<{quota: number, usage: number, available: number}>}
 */
export async function getBrowserStorageQuota() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
      }
    }
  } catch {
    // Feature not available
  }

  return {
    quota: 0,
    usage: 0,
    available: 0,
  }
}

/**
 * Detect the best available storage mechanism
 * @returns {'indexeddb' | 'localstorage' | 'none'}
 */
export function detectBestStorage() {
  if (isIndexedDBAvailable()) {
    return 'indexeddb'
  }
  if (isLocalStorageAvailable()) {
    return 'localstorage'
  }
  return 'none'
}
