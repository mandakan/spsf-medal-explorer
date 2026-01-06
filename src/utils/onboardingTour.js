import { BUILD } from '../config/buildInfo'

const KEY = 'app:onboardingTour:lastSeen'

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

export function getTourLastSeen() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setTourLastSeen(id) {
  try {
    if (id) localStorage.setItem(KEY, id)
  } catch {
    // ignore
  }
}

export function isTourSeen(id = getTourId()) {
  return getTourLastSeen() === id
}

export function requestManualTourStart(page) {
  try {
    sessionStorage.setItem(MANUAL_TOUR_KEY, page)
    return true
  } catch {
    return false
  }
}
