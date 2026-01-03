import { BUILD } from '../config/buildInfo'

const WHATSNEW_STORAGE_KEY = 'whatsnew:lastSeen'

/**
 * User-facing release identity (semver). Use version only for gating.
 */
export function getReleaseId() {
  return BUILD?.version || ''
}

/**
 * Create a stable build identifier from build metadata.
 * Example: "1.5.0+210"
 */
function getBuildId() {
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

function hasNewWhatsNew() {
  const id = getReleaseId()
  if (!id) return false
  return getLastSeen() !== id
}

export function isProductionEnv() {
  if (BUILD?.env) return BUILD.env === 'production'
  try {
    const hostname =
      typeof window !== 'undefined' && window.location && window.location.hostname
        ? window.location.hostname
        : ''
    if (!hostname) return false
    return !(hostname === 'localhost' || hostname === '127.0.0.1')
  } catch {
    return false
  }
}
