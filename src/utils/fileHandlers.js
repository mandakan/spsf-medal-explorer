/**
 * File handling utilities for browser environments.
 * Safe no-ops on server/test environments.
 */

/**
 * Download data as a file in the browser.
 * Accepts string | Blob | Uint8Array.
 */
export function downloadFile(data, filename, mimeType = 'application/octet-stream') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Non-browser environment: no-op
    return
  }

  let blob
  if (data instanceof Blob) {
    blob = data
  } else if (data instanceof Uint8Array) {
    blob = new Blob([data], { type: mimeType })
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType + ';charset=utf-8' })
  } else if (data != null) {
    // Fallback to JSON
    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  } else {
    throw new Error('downloadFile: invalid data')
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
