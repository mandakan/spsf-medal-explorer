import 'fake-indexeddb/auto'
import {
  isIndexedDBAvailable,
  isLocalStorageAvailable,
  getBrowserStorageQuota,
  detectBestStorage,
} from '../src/utils/storageDetection'

describe('storageDetection', () => {
  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true)
    })

    it('returns false when localStorage is undefined', () => {
      const original = global.localStorage
      delete global.localStorage
      expect(isLocalStorageAvailable()).toBe(false)
      global.localStorage = original
    })

    it('returns false when localStorage throws', () => {
      const original = global.localStorage
      Object.defineProperty(global, 'localStorage', {
        get() {
          throw new Error('localStorage is disabled')
        },
        configurable: true,
      })
      expect(isLocalStorageAvailable()).toBe(false)
      Object.defineProperty(global, 'localStorage', {
        value: original,
        configurable: true,
      })
    })
  })

  describe('isIndexedDBAvailable', () => {
    it('returns true when indexedDB is available', () => {
      expect(isIndexedDBAvailable()).toBe(true)
    })

    it('returns false when indexedDB is undefined', () => {
      const original = global.indexedDB
      delete global.indexedDB
      expect(isIndexedDBAvailable()).toBe(false)
      global.indexedDB = original
    })

    it('returns false when indexedDB access throws', () => {
      const original = global.indexedDB
      Object.defineProperty(global, 'indexedDB', {
        get() {
          throw new Error('IndexedDB is disabled')
        },
        configurable: true,
      })
      expect(isIndexedDBAvailable()).toBe(false)
      Object.defineProperty(global, 'indexedDB', {
        value: original,
        configurable: true,
      })
    })
  })

  describe('getBrowserStorageQuota', () => {
    it('returns quota information when storage.estimate is available', async () => {
      const mockEstimate = { quota: 100000, usage: 50000 }
      global.navigator.storage = {
        estimate: jest.fn().mockResolvedValue(mockEstimate),
      }

      const result = await getBrowserStorageQuota()
      expect(result.quota).toBe(100000)
      expect(result.usage).toBe(50000)
      expect(result.available).toBe(50000)

      delete global.navigator.storage
    })

    it('returns zero values when storage.estimate is not available', async () => {
      const result = await getBrowserStorageQuota()
      expect(result.quota).toBe(0)
      expect(result.usage).toBe(0)
      expect(result.available).toBe(0)
    })

    it('returns zero values when estimate throws', async () => {
      global.navigator.storage = {
        estimate: jest.fn().mockRejectedValue(new Error('Quota error')),
      }

      const result = await getBrowserStorageQuota()
      expect(result.quota).toBe(0)
      expect(result.usage).toBe(0)
      expect(result.available).toBe(0)

      delete global.navigator.storage
    })
  })

  describe('detectBestStorage', () => {
    it('returns indexeddb when available', () => {
      expect(detectBestStorage()).toBe('indexeddb')
    })

    it('returns localstorage when indexedDB is not available', () => {
      const original = global.indexedDB
      delete global.indexedDB
      expect(detectBestStorage()).toBe('localstorage')
      global.indexedDB = original
    })

    it('returns none when neither storage is available', () => {
      const originalIDB = global.indexedDB
      const originalLS = global.localStorage
      delete global.indexedDB
      delete global.localStorage
      expect(detectBestStorage()).toBe('none')
      global.indexedDB = originalIDB
      global.localStorage = originalLS
    })
  })
})
