import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RunningShootingCourseForm from '../src/components/form/RunningShootingCourseForm'

// Mock the hooks and utilities
jest.mock('../src/hooks/useProfile', () => ({
  useProfile: () => ({ currentProfile: { sex: 'male', dateOfBirth: '1990-01-01' } }),
}))

jest.mock('../src/utils/requirementDefaults', () => ({
  getRunningShootingCourseDefaults: jest.fn(() => ({
    maxPoints: null,
    achievementType: 'running_shooting_course',
  })),
  getRequirementHint: jest.fn(() => null),
}))

describe('RunningShootingCourseForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSubmitAndAddAnother = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mocks to default state before each test
    const { getRunningShootingCourseDefaults, getRequirementHint } = require('../src/utils/requirementDefaults')
    getRunningShootingCourseDefaults.mockReturnValue({
      maxPoints: null,
      achievementType: 'running_shooting_course',
    })
    getRequirementHint.mockReturnValue(null)
  })

  const renderForm = (props = {}) => {
    return render(
      <RunningShootingCourseForm
        medal={{ id: 'test-medal' }}
        onSubmit={mockOnSubmit}
        onSubmitAndAddAnother={mockOnSubmitAndAddAnother}
        loading={false}
        {...props}
      />
    )
  }

  describe('rendering', () => {
    test('renders date input field', () => {
      renderForm()
      expect(screen.getByLabelText('Datum för terränglopp')).toBeInTheDocument()
    })

    test('renders points input field', () => {
      renderForm()
      expect(screen.getByLabelText('Totalpoäng')).toBeInTheDocument()
    })

    test('renders submit buttons', () => {
      renderForm()
      expect(screen.getByText('Spara & Stäng')).toBeInTheDocument()
      expect(screen.getByText('Spara & Lägg till fler')).toBeInTheDocument()
    })

    test('renders loading state on buttons', () => {
      renderForm({ loading: true })
      const loadingTexts = screen.getAllByText('Sparar...')
      expect(loadingTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('default values', () => {
    test('initializes with today date', () => {
      renderForm()
      const today = new Date().toISOString().split('T')[0]
      const dateInput = screen.getByLabelText('Datum för terränglopp')
      expect(dateInput.value).toBe(today)
    })

    test('pre-populates points from medal requirements', () => {
      const { getRunningShootingCourseDefaults } = require('../src/utils/requirementDefaults')
      getRunningShootingCourseDefaults.mockReturnValue({
        maxPoints: 45,
        achievementType: 'running_shooting_course',
      })

      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      expect(pointsInput.value).toBe('45')
    })

    test('shows max points hint when available', () => {
      const { getRunningShootingCourseDefaults } = require('../src/utils/requirementDefaults')
      getRunningShootingCourseDefaults.mockReturnValue({
        maxPoints: 45,
        achievementType: 'running_shooting_course',
      })

      renderForm()
      expect(screen.getByText(/Max 45 poäng krävs/)).toBeInTheDocument()
    })
  })

  describe('achievement type detection', () => {
    test('uses running_shooting_course type by default', async () => {
      const { getRunningShootingCourseDefaults } = require('../src/utils/requirementDefaults')
      getRunningShootingCourseDefaults.mockReturnValue({
        maxPoints: null,
        achievementType: 'running_shooting_course',
      })

      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '30', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            achievementType: 'running_shooting_course',
          })
        )
      })
    })

    test('uses skis_shooting_course type when detected', async () => {
      const { getRunningShootingCourseDefaults } = require('../src/utils/requirementDefaults')
      getRunningShootingCourseDefaults.mockReturnValue({
        maxPoints: 50,
        achievementType: 'skis_shooting_course',
      })

      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '40', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            achievementType: 'skis_shooting_course',
          })
        )
      })
    })
  })

  describe('validation', () => {
    test('shows error when date is empty', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för terränglopp')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Datum krävs')).toBeInTheDocument()
      })
    })

    test('shows error when points is empty', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Poäng krävs')).toBeInTheDocument()
      })
    })

    test('shows error when points is negative', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '-5', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Poäng måste vara 0 eller högre')).toBeInTheDocument()
      })
    })

    test('accepts valid points value of 0', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '0', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('save flows', () => {
    test('shows validation error and prevents submission with invalid data', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '-5', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Lägg till fler'))

      await waitFor(() => {
        expect(screen.getByText('Poäng måste vara 0 eller högre')).toBeInTheDocument()
      })
      expect(mockOnSubmitAndAddAnother).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    test('date input has aria-invalid when error exists', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för terränglopp')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(dateInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('points input has aria-invalid when error exists', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '-1', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(pointsInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('submit buttons are disabled when loading', () => {
      renderForm({ loading: true })
      const submitButtons = screen.getAllByRole('button', { name: /sparar/i })
      submitButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })
})
