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
  if (!navigator.canShare) return false

  try {
    // Check if we can share files by testing with a sample file
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

/**
 * Share backup file via native share sheet
 * @param {Blob} blob - File data
 * @param {string} filename - Filename for the shared file
 * @param {string} [title='Säkerhetskopia'] - Share title (Swedish)
 * @returns {Promise<{success: boolean, cancelled?: boolean}>} Share result
 * @throws {Error} If sharing not supported or other error occurs
 */
export async function shareFile(blob, filename, title = 'Säkerhetskopia') {
  if (!isFileShareSupported()) {
    throw new Error('Fildelning stöds inte på den här enheten')
  }

  const file = new File([blob], filename, {
    type: blob.type || 'application/json'
  })

  try {
    await navigator.share({
      files: [file],
      title: title,
      text: 'Säkerhetskopia av mina märkesframsteg'
    })

    return { success: true }
  } catch (error) {
    // User cancelled the share - not an error
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true }
    }

    // Other errors (permission denied, etc.)
    throw error
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
