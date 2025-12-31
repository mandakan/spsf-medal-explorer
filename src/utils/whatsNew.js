import { BUILD } from '../config/buildInfo'

export const WHATSNEW_STORAGE_KEY = 'whatsnew:lastSeen'

/**
 * Create a stable build identifier from build metadata.
 * Example: "1.5.0+210"
 */
export function getBuildId() {
  const version = BUILD?.version || ''
  const build = BUILD?.number || ''
  return [version, build].filter(Boolean).join('+')
}

export function getLastSeen() {
  try {
    return localStorage.getItem(WHATSNEW_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setLastSeen(id) {
  try {
    if (id) localStorage.setItem(WHATSNEW_STORAGE_KEY, id)
  } catch {
    // ignore
  }
}

export function hasNewWhatsNew() {
  const id = getBuildId()
  if (!id) return false
  return getLastSeen() !== id
}
