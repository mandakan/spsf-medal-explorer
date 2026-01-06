import {
  MANUAL_TOUR_KEY,
  ONBOARDING_TOUR_ID,
  TOUR_VERSIONS,
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

  it('getTourId returns tour-specific ID with default medals type', () => {
    expect(getTourId()).toBe(`medals-${TOUR_VERSIONS.medals}`)
  })

  it('getTourId returns correct ID for different tour types', () => {
    expect(getTourId('medals')).toBe(`medals-${TOUR_VERSIONS.medals}`)
    expect(getTourId('tree-view')).toBe(`tree-view-${TOUR_VERSIONS['tree-view']}`)
  })

  it('getTourId falls back to ONBOARDING_TOUR_ID for unknown tour types', () => {
    expect(getTourId('unknown')).toBe(`unknown-${ONBOARDING_TOUR_ID}`)
  })

  it('setTourLastSeen + isTourSeen works for medals tour', () => {
    const medalsId = getTourId('medals')
    expect(isTourSeen(medalsId)).toBe(false)
    setTourLastSeen(medalsId)
    expect(isTourSeen(medalsId)).toBe(true)
  })

  it('setTourLastSeen + isTourSeen works for tree-view tour', () => {
    const treeViewId = getTourId('tree-view')
    expect(isTourSeen(treeViewId)).toBe(false)
    setTourLastSeen(treeViewId)
    expect(isTourSeen(treeViewId)).toBe(true)
  })

  it('tours are tracked independently', () => {
    const medalsId = getTourId('medals')
    const treeViewId = getTourId('tree-view')

    setTourLastSeen(medalsId)
    expect(isTourSeen(medalsId)).toBe(true)
    expect(isTourSeen(treeViewId)).toBe(false)

    setTourLastSeen(treeViewId)
    expect(isTourSeen(treeViewId)).toBe(true)
  })

  it('requestManualTourStart stores page in sessionStorage', () => {
    expect(sessionStorage.getItem(MANUAL_TOUR_KEY)).toBe(null)
    const ok = requestManualTourStart('medals')
    expect(ok).toBe(true)
    expect(sessionStorage.getItem(MANUAL_TOUR_KEY)).toBe('medals')
  })
})
