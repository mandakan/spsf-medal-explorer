import React from 'react'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import AchievementEntryDialog from '../src/components/AchievementEntryDialog'
import { OnboardingTourProvider } from '../src/contexts/OnboardingTourContext'
import OnboardingTourOverlay from '../src/components/OnboardingTourOverlay'
import * as onboardingUtils from '../src/utils/onboardingTour'

// Mock the hooks and components that AchievementEntryDialog depends on
jest.mock('../src/hooks/useAchievementHistory', () => ({
  __esModule: true,
  useAchievementHistory: () => ({
    addAchievement: jest.fn(),
    unlockMedal: jest.fn(),
  }),
}))

jest.mock('../src/hooks/useProfile', () => ({
  __esModule: true,
  useProfile: () => ({
    currentProfile: { sex: 'male', dateOfBirth: '1990-01-01' },
    hydrated: true,
  }),
}))

jest.mock('../src/components/Icon', () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}))

// Sample medal for testing
const mockMedal = {
  id: 'test-medal',
  displayName: 'Test Medal',
  requirements: [
    { type: 'precision_series', pointThresholds: { A: { min: 45 } } },
  ],
}

const mockMultiTypeMedal = {
  id: 'multi-type-medal',
  displayName: 'Multi Type Medal',
  requirements: [
    { type: 'precision_series', pointThresholds: { A: { min: 45 } } },
    { type: 'application_series', thresholds: { A: { minHits: 5, maxTimeSeconds: 60 } } },
  ],
}

function renderDialog(medal = mockMedal, open = true) {
  const onClose = jest.fn()
  return render(
    <OnboardingTourProvider>
      <AchievementEntryDialog medal={medal} open={open} onClose={onClose} />
      <OnboardingTourOverlay />
    </OnboardingTourProvider>
  )
}

describe('AchievementEntryDialog tour integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should auto-start tour on first dialog open', async () => {
    renderDialog()

    // Fast-forward past the 300ms delay
    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    // Tour should be visible
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /smart inmatning/i })).toBeInTheDocument()
    })
  })

  it('should NOT auto-start tour if already seen', async () => {
    // Mark tour as seen
    const tourId = onboardingUtils.getTourId('achievement-entry')
    localStorage.setItem(`app:onboardingTour:seen:${tourId}`, 'true')

    renderDialog()

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    // Tour should NOT be visible (only the achievement dialog)
    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(1) // Only the achievement entry dialog
    expect(dialogs[0]).toHaveAttribute('aria-labelledby', 'achievement-entry-title')
  })

  it('should restart tour when help button is clicked', async () => {
    // Mark tour as seen so it doesn't auto-start
    const tourId = onboardingUtils.getTourId('achievement-entry')
    localStorage.setItem(`app:onboardingTour:seen:${tourId}`, 'true')

    renderDialog()

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    // Find and click the help button
    const helpButton = screen.getByRole('button', { name: /visa guide/i })
    await act(async () => {
      fireEvent.click(helpButton)
    })

    // Tour should now be visible
    await waitFor(() => {
      expect(screen.getByText('Smart inmatning')).toBeInTheDocument()
    })
  })

  it('should show hint when type selection is required', async () => {
    renderDialog(mockMultiTypeMedal)

    await act(async () => {
      jest.advanceTimersByTime(350)
    })

    // Advance to step 2 (type-selector)
    const nextButton = screen.getByRole('button', { name: /nästa/i })
    await act(async () => {
      fireEvent.click(nextButton)
    })

    // The hint should be shown because no type is selected yet
    await waitFor(() => {
      expect(screen.getByText(/välj en aktivitetstyp för att fortsätta/i)).toBeInTheDocument()
    })
  })
})
