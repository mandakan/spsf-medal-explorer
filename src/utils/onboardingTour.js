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

export function getTourId() {
  // Keep stable across builds unless we explicitly bump ONBOARDING_TOUR_ID.
  // BUILD is imported to ensure this module is bundled consistently with app config.
  void BUILD
  return ONBOARDING_TOUR_ID
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
