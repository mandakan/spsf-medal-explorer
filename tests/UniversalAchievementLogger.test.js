import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import UniversalAchievementLogger from '../src/components/UniversalAchievementLogger'

// Mock the hooks and utilities
jest.mock('../src/hooks/useAchievementHistory', () => ({
  useAchievementHistory: jest.fn(() => ({
    addAchievement: jest.fn().mockResolvedValue({}),
    unlockMedal: jest.fn().mockResolvedValue({}),
  })),
}))

jest.mock('../src/hooks/useProfile', () => ({
  useProfile: jest.fn(() => ({
    profile: {
      dateOfBirth: '1990-01-01',
      sex: 'male',
    },
  })),
}))

jest.mock('../src/utils/achievementMapper', () => ({
  detectMedalFormType: jest.fn(() => 'precision_series'),
  mapFormToAchievement: jest.fn((params) => ({
    id: 'test-achievement-id',
    type: 'precision_series',
    date: params.formData?.date || '2026-01-15',
    weaponGroup: params.formData?.weaponGroup || 'C',
    points: params.formData?.points || 34,
  })),
}))

jest.mock('../src/validators/universalValidator', () => ({
  validateAchievement: jest.fn(() => ({ valid: true, errors: [] })),
}))

jest.mock('../src/utils/requirementDefaults', () => ({
  getPrecisionSeriesDefaults: jest.fn(() => ({
    weaponGroup: 'C',
    points: 34,
  })),
  getPrecisionSeriesThresholds: jest.fn(() => ({ min: 34 })),
  getRequirementHint: jest.fn(() => '3 precisionsserier'),
  getAvailableWeaponGroups: jest.fn(() => ['C', 'B', 'A']),
}))

describe('UniversalAchievementLogger', () => {
  const precisionSeriesMedal = {
    id: 'pistol-mark-bronze',
    displayName: 'Pistolmärke Brons',
    requirements: {
      and: [
        {
          type: 'precision_series',
          pointThresholds: { C: { min: 34 } },
        },
      ],
    },
  }

  const multiTypeMedal = {
    id: 'test-multi-medal',
    displayName: 'Multi Type Medal',
    requirements: {
      and: [
        {
          type: 'precision_series',
          pointThresholds: { C: { min: 34 } },
        },
        {
          type: 'application_series',
          thresholds: { C: { minHits: 5, maxTimeSeconds: 50 } },
        },
      ],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('success toast', () => {
    test('shows success toast after save and add another', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      const mockAddAchievement = jest.fn().mockResolvedValue({})
      useAchievementHistory.mockReturnValue({
        addAchievement: mockAddAchievement,
        unlockMedal: jest.fn(),
      })

      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      // Fill form and click "Spara & Lägg till fler"
      const saveAndAddButton = screen.getByText('Spara & Lägg till fler')

      await act(async () => {
        fireEvent.click(saveAndAddButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Aktivitet sparad!')).toBeInTheDocument()
      })
    })

    test('auto-dismisses success toast after 3 seconds', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockResolvedValue({}),
        unlockMedal: jest.fn(),
      })

      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      const saveAndAddButton = screen.getByText('Spara & Lägg till fler')

      await act(async () => {
        fireEvent.click(saveAndAddButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Aktivitet sparad!')).toBeInTheDocument()
      })

      // Fast-forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.queryByText('Aktivitet sparad!')).not.toBeInTheDocument()
      })
    })

    test('success toast has proper accessibility attributes', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockResolvedValue({}),
        unlockMedal: jest.fn(),
      })

      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      const saveAndAddButton = screen.getByText('Spara & Lägg till fler')

      await act(async () => {
        fireEvent.click(saveAndAddButton)
      })

      await waitFor(() => {
        const toast = screen.getByRole('status')
        expect(toast).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('type selection preservation', () => {
    test('medal with single type shows form directly', () => {
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      // Should show form directly, not type selector
      expect(screen.queryByText('Välj vilken typ du vill logga:')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    test('shows error message when save fails', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockRejectedValue(new Error('Sparning misslyckades')),
        unlockMedal: jest.fn(),
      })

      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      const saveButton = screen.getByText('Spara & Stäng')

      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Sparning misslyckades')).toBeInTheDocument()
      })
    })

    test('error alert has proper accessibility attributes', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockRejectedValue(new Error('Test error')),
        unlockMedal: jest.fn(),
      })

      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      const saveButton = screen.getByText('Spara & Stäng')

      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })

  describe('onSuccess callback', () => {
    test('calls onSuccess after successful save and close', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockResolvedValue({}),
        unlockMedal: jest.fn(),
      })

      const onSuccess = jest.fn()
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} onSuccess={onSuccess} />)

      const saveButton = screen.getByText('Spara & Stäng')

      await act(async () => {
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    test('does not call onSuccess after save and add another', async () => {
      const { useAchievementHistory } = require('../src/hooks/useAchievementHistory')
      useAchievementHistory.mockReturnValue({
        addAchievement: jest.fn().mockResolvedValue({}),
        unlockMedal: jest.fn(),
      })

      const onSuccess = jest.fn()
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} onSuccess={onSuccess} />)

      const saveAndAddButton = screen.getByText('Spara & Lägg till fler')

      await act(async () => {
        fireEvent.click(saveAndAddButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Aktivitet sparad!')).toBeInTheDocument()
      })

      // onSuccess should NOT be called - form stays open
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('component structure', () => {
    test('renders with proper aria region', () => {
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      const region = screen.getByRole('region')
      expect(region).toBeInTheDocument()
    })

    test('displays medal name in heading', () => {
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} />)

      expect(screen.getByText(/Pistolmärke Brons/)).toBeInTheDocument()
    })

    test('compact mode hides heading visually but keeps it accessible', () => {
      render(<UniversalAchievementLogger medal={precisionSeriesMedal} compact={true} />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('sr-only')
    })
  })
})
