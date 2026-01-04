import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Home from '../src/pages/Home.jsx'
import MedalsList from '../src/pages/MedalsList.jsx'
import { OnboardingTourProvider } from '../src/contexts/OnboardingTourContext.jsx'
import { MANUAL_TOUR_KEY } from '../src/utils/onboardingTour'

jest.mock('../src/hooks/useMedalDatabase', () => ({
  __esModule: true,
  useMedalDatabase: () => ({
    medalDatabase: { getAllMedals: () => [] },
    loading: false,
  }),
}))

jest.mock('../src/hooks/useMedalCalculator', () => ({
  __esModule: true,
  useAllMedalStatuses: () => ({
    locked: [],
    available: [],
    eligible: [],
    unlocked: [],
  }),
}))

jest.mock('../src/hooks/useFilter', () => ({
  __esModule: true,
  useFilter: () => ({
    filters: {},
    setFilter: jest.fn(),
    setFilters: jest.fn(),
    clearAllFilters: jest.fn(),
    hasActiveFilters: false,
  }),
}))

jest.mock('../src/hooks/useMedalSearch', () => ({
  __esModule: true,
  useMedalSearch: () => ({
    query: '',
    setQuery: jest.fn(),
    suggestions: [],
  }),
}))

jest.mock('../src/logic/filterEngine', () => ({
  __esModule: true,
  applyFilters: (medals) => medals,
  sortMedals: (medals) => medals,
}))

jest.mock('../src/hooks/useProfile', () => ({
  __esModule: true,
  useProfile: () => ({
    currentProfile: null,
    hydrated: true,
  }),
}))

jest.mock('../src/components/SearchBar', () => ({
  __esModule: true,
  default: () => <div data-testid="searchbar" />,
}))
jest.mock('../src/components/FilterPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="filterpanel" />,
}))
jest.mock('../src/components/FilterPresets', () => ({
  __esModule: true,
  default: () => <div data-testid="filterpresets" />,
}))
jest.mock('../src/components/QuickFilterChips', () => ({
  __esModule: true,
  default: () => <div data-testid="chips" />,
}))
jest.mock('../src/components/MedalList', () => ({
  __esModule: true,
  default: () => <div data-testid="medallist" />,
}))
jest.mock('../src/components/MobileBottomSheet', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="sheet">{children}</div>,
}))
jest.mock('../src/components/ProfileExperienceBanner', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../src/components/ReviewLegend', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../src/components/Disclaimer', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../src/components/Icon', () => ({
  __esModule: true,
  default: () => null,
}))

describe('Manual onboarding tour start: Home -> /medals', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('Home quick guide sets session flag; MedalsList consumes it', async () => {
    const setSpy = jest.spyOn(window.sessionStorage.__proto__, 'setItem')
    const removeSpy = jest.spyOn(window.sessionStorage.__proto__, 'removeItem')

    render(
      <OnboardingTourProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/medals" element={<MedalsList />} />
          </Routes>
        </MemoryRouter>
      </OnboardingTourProvider>
    )

    const link = screen.getByRole('link', { name: /Visa snabbguide/i })
    await act(async () => {
      fireEvent.click(link)
    })

    expect(setSpy).toHaveBeenCalledWith(MANUAL_TOUR_KEY, 'medals')
    expect(removeSpy).toHaveBeenCalledWith(MANUAL_TOUR_KEY)
    expect(sessionStorage.getItem(MANUAL_TOUR_KEY)).toBe(null)

    setSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
