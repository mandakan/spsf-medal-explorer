import { BUILD } from '../config/buildInfo'

const KEY_PREFIX = 'app:onboardingTour:seen:'

/**
 * Session key used to request a manual onboarding tour start on a specific page.
 * Consumed once by the target page.
 */
export const MANUAL_TOUR_KEY = 'app:onboardingTour:manualStart'

/**
 * Onboarding tour identity.
 * Keep separate from BUILD.version so we can iterate onboarding without forcing a release bump.
 * Bump this when steps/copy/targets change in a way that should re-run onboarding.
 */
export const ONBOARDING_TOUR_ID = 'v1'

/**
 * Tour-specific version IDs
 */
export const TOUR_VERSIONS = {
  medals: 'v1',
  'tree-view': 'v1',
}

export function getTourId(tourType = 'medals') {
  // Keep stable across builds unless we explicitly bump version for specific tour.
  // BUILD is imported to ensure this module is bundled consistently with app config.
  void BUILD
  const version = TOUR_VERSIONS[tourType] || ONBOARDING_TOUR_ID
  return `${tourType}-${version}`
}

export function getTourLastSeen(tourType = 'medals') {
  try {
    const id = getTourId(tourType)
    return localStorage.getItem(KEY_PREFIX + id)
  } catch {
    return null
  }
}

export function setTourLastSeen(id) {
  try {
    if (id) localStorage.setItem(KEY_PREFIX + id, 'true')
  } catch {
    // ignore
  }
}

export function isTourSeen(id = getTourId()) {
  try {
    return localStorage.getItem(KEY_PREFIX + id) === 'true'
  } catch {
    return false
  }
}

export function requestManualTourStart(page) {
  try {
    sessionStorage.setItem(MANUAL_TOUR_KEY, page)
    return true
  } catch {
    return false
  }
}
