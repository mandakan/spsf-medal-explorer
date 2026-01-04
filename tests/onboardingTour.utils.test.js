import {
  MANUAL_TOUR_KEY,
  ONBOARDING_TOUR_ID,
  getTourId,
  isTourSeen,
  setTourLastSeen,
  requestManualTourStart,
} from '../src/utils/onboardingTour'

describe('onboardingTour utils', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('getTourId returns ONBOARDING_TOUR_ID', () => {
    expect(getTourId()).toBe(ONBOARDING_TOUR_ID)
  })

  it('setTourLastSeen + isTourSeen works', () => {
    expect(isTourSeen()).toBe(false)
    setTourLastSeen(getTourId())
    expect(isTourSeen()).toBe(true)
  })

  it('requestManualTourStart stores page in sessionStorage', () => {
    expect(sessionStorage.getItem(MANUAL_TOUR_KEY)).toBe(null)
    const ok = requestManualTourStart('medals')
    expect(ok).toBe(true)
    expect(sessionStorage.getItem(MANUAL_TOUR_KEY)).toBe('medals')
  })
})
