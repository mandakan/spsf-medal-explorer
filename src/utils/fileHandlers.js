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

/**
 * Read a File/Blob into string (text).
 * Enforces a 50MB max size.
 */
export function readFile(file, maxBytes = 50 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    try {
      if (!file) {
        reject(new Error('No file provided'))
        return
      }
      const size = file.size ?? file.length ?? 0
      if (size > maxBytes) {
        reject(new Error(`File too large. Max ${formatFileSize(maxBytes)}.`))
        return
      }

      if (typeof FileReader === 'undefined') {
        // Non-browser environment: try to read as text if provided as string/Buffer
        if (typeof file === 'string') return resolve(file)
        if (file instanceof Uint8Array) return resolve(new TextDecoder('utf-8').decode(file))
        reject(new Error('FileReader not available in this environment'))
        return
      }

      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onload = () => resolve(reader.result)
      reader.readAsText(file)
    } catch (err) {
      reject(err)
    }
  })
}

export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let num = bytes
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024
    i++
  }
  return `${num.toFixed(1)} ${units[i]}`
}
