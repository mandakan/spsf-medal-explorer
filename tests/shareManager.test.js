// tests/shareManager.test.js

import {
  isShareSupported,
  isFileShareSupported,
  shareFile,
  getShareMessage
} from '../src/utils/shareManager'

describe('shareManager', () => {
  describe('isShareSupported', () => {
    it('should return true when navigator.share exists', () => {
      global.navigator.share = jest.fn()
      expect(isShareSupported()).toBe(true)
    })

    it('should return false when navigator.share does not exist', () => {
      const originalShare = global.navigator.share
      delete global.navigator.share
      expect(isShareSupported()).toBe(false)
      global.navigator.share = originalShare
    })
  })

  describe('isFileShareSupported', () => {
    const originalUserAgent = global.navigator.userAgent

    afterEach(() => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      })
    })

    it('should return false when navigator.share is not supported', () => {
      const originalShare = global.navigator.share
      delete global.navigator.share
      expect(isFileShareSupported()).toBe(false)
      global.navigator.share = originalShare
    })

    it('should return false on desktop browsers', () => {
      global.navigator.share = jest.fn()
      global.navigator.canShare = jest.fn().mockReturnValue(true)
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true
      })
      expect(isFileShareSupported()).toBe(false)
    })

    it('should return true on mobile when both share and canShare support files', () => {
      global.navigator.share = jest.fn()
      global.navigator.canShare = jest.fn().mockReturnValue(true)
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true
      })
      expect(isFileShareSupported()).toBe(true)
    })

    it('should return true on mobile when canShare does not exist (fallback)', () => {
      global.navigator.share = jest.fn()
      const originalCanShare = global.navigator.canShare
      delete global.navigator.canShare
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36',
        writable: true
      })
      expect(isFileShareSupported()).toBe(true)
      global.navigator.canShare = originalCanShare
    })

    it('should return false when canShare returns false for files', () => {
      global.navigator.share = jest.fn()
      global.navigator.canShare = jest.fn().mockReturnValue(false)
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true
      })
      expect(isFileShareSupported()).toBe(false)
    })

    it('should handle exceptions gracefully', () => {
      global.navigator.share = jest.fn()
      global.navigator.canShare = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true
      })
      expect(isFileShareSupported()).toBe(false)
    })
  })

  describe('shareFile', () => {
    const originalUserAgent = global.navigator.userAgent

    beforeEach(() => {
      global.navigator.share = jest.fn()
      global.navigator.canShare = jest.fn().mockReturnValue(true)
      // Set mobile user agent for shareFile tests
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true
      })
    })

    afterEach(() => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      })
    })

    it('should throw error when file sharing is not supported', async () => {
      delete global.navigator.share
      const blob = new Blob(['test'], { type: 'application/json' })

      await expect(shareFile(blob, 'test.json')).rejects.toThrow(
        'Fildelning stöds inte på den här enheten'
      )
    })

    it('should successfully share file', async () => {
      global.navigator.share = jest.fn().mockResolvedValue(undefined)
      const blob = new Blob(['test'], { type: 'application/json' })

      const result = await shareFile(blob, 'test.json')

      expect(result).toEqual({ success: true })
      expect(global.navigator.share).toHaveBeenCalledWith({
        files: expect.arrayContaining([
          expect.objectContaining({
            name: 'test.json',
            type: 'application/json'
          })
        ])
      })
    })

    it('should share file without title or text for compatibility', async () => {
      global.navigator.share = jest.fn().mockResolvedValue(undefined)
      const blob = new Blob(['test'], { type: 'application/json' })

      await shareFile(blob, 'test.json')

      // Verify no title or text is included (Android compatibility)
      const shareCall = global.navigator.share.mock.calls[0][0]
      expect(shareCall.title).toBeUndefined()
      expect(shareCall.text).toBeUndefined()
      expect(shareCall.files).toBeDefined()
    })

    it('should handle user cancellation gracefully', async () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      global.navigator.share = jest.fn().mockRejectedValue(abortError)
      const blob = new Blob(['test'], { type: 'application/json' })

      const result = await shareFile(blob, 'test.json')

      expect(result).toEqual({ success: false, cancelled: true })
    })

    it('should throw error for non-abort errors', async () => {
      const otherError = new Error('Permission denied')
      otherError.name = 'NotAllowedError'
      global.navigator.share = jest.fn().mockRejectedValue(otherError)
      const blob = new Blob(['test'], { type: 'application/json' })

      await expect(shareFile(blob, 'test.json')).rejects.toThrow('Permission denied')
    })

    it('should use blob type or default to application/json', async () => {
      global.navigator.share = jest.fn().mockResolvedValue(undefined)
      const blobWithoutType = new Blob(['test'])

      await shareFile(blobWithoutType, 'test.json')

      expect(global.navigator.share).toHaveBeenCalledWith({
        files: expect.arrayContaining([
          expect.objectContaining({
            type: 'application/json'
          })
        ])
      })
    })
  })

  describe('getShareMessage', () => {
    const originalUserAgent = global.navigator.userAgent

    afterEach(() => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      })
    })

    it('should return iOS-specific message for iPhone', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true
      })

      expect(getShareMessage()).toBe('Spara till iCloud Drive, Filer eller annan app')
    })

    it('should return iOS-specific message for iPad', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
        writable: true
      })

      expect(getShareMessage()).toBe('Spara till iCloud Drive, Filer eller annan app')
    })

    it('should return Android-specific message', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36',
        writable: true
      })

      expect(getShareMessage()).toBe('Spara till Google Drive, Filer eller annan app')
    })

    it('should return generic message for desktop', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      })

      expect(getShareMessage()).toBe('Spara till molnlagring eller annan app')
    })
  })
})
