// src/utils/shareManager.js

/**
 * Check if Web Share API is supported
 * @returns {boolean} True if navigator.share is available
 */
export function isShareSupported() {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * Check if device can share files (not just text/URLs)
 * @returns {boolean} True if file sharing is supported
 */
export function isFileShareSupported() {
  if (!isShareSupported()) return false

  // CRITICAL: Desktop browsers don't support file sharing even if canShare returns true
  // Only mobile browsers (iOS Safari, Android Chrome) support file sharing
  const userAgent = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod/.test(userAgent)

  if (!isMobile) {
    // Desktop browsers don't support file sharing
    return false
  }

  // On mobile, check if canShare supports files
  if (navigator.canShare) {
    try {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      return navigator.canShare({ files: [testFile] })
    } catch {
      return false
    }
  }

  // If canShare doesn't exist on mobile, assume support
  return true
}

/**
 * Share backup file via native share sheet
 * @param {Blob} blob - File data
 * @param {string} filename - Filename for the shared file
 * @returns {Promise<{success: boolean, cancelled?: boolean}>} Share result
 * @throws {Error} If sharing not supported or other error occurs
 */
export async function shareFile(blob, filename) {
  if (!isFileShareSupported()) {
    throw new Error('Fildelning stöds inte på den här enheten')
  }

  // Android Chrome is picky about MIME types - use text/plain for better compatibility
  // Even though it's JSON, many apps accept text/plain but reject application/json
  const file = new File([blob], filename, {
    type: 'text/plain'
  })

  try {
    // CRITICAL: Do NOT call canShare() here - it may break the user gesture chain
    // Note: Many browsers don't support title/text when sharing files
    // Only include the files array to maximize compatibility
    await navigator.share({
      files: [file]
    })

    return { success: true }
  } catch (error) {
    // Log detailed error info for debugging
    console.error('Share failed:', {
      name: error.name,
      message: error.message,
      error: error,
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    })

    // User cancelled the share - not an error
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true }
    }

    // Other errors (permission denied, etc.)
    // Throw with detailed error info
    throw new Error(`Delning misslyckades: ${error.name} - ${error.message}`)
  }
}

/**
 * Get device-appropriate message for sharing to cloud storage
 * @returns {string} Swedish instruction text based on device
 */
export function getShareMessage() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)

  if (isIOS) {
    return 'Spara till iCloud Drive, Filer eller annan app'
  }

  if (isAndroid) {
    return 'Spara till Google Drive, Filer eller annan app'
  }

  return 'Spara till molnlagring eller annan app'
}
