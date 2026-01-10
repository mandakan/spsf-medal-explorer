import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AirPistolPrecisionForm from '../src/components/form/AirPistolPrecisionForm'

// Mock the hooks and utilities
jest.mock('../src/utils/requirementDefaults', () => ({
  getAirPistolPrecisionDefaults: jest.fn(() => ({
    minPointsPerSeries: null,
    minSeries: 5,
  })),
  getRequirementHint: jest.fn(() => null),
}))

describe('AirPistolPrecisionForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSubmitAndAddAnother = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mocks to default state before each test
    const { getAirPistolPrecisionDefaults, getRequirementHint } = require('../src/utils/requirementDefaults')
    getAirPistolPrecisionDefaults.mockReturnValue({
      minPointsPerSeries: null,
      minSeries: 5,
    })
    getRequirementHint.mockReturnValue(null)
  })

  const renderForm = (props = {}) => {
    return render(
      <AirPistolPrecisionForm
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
      expect(screen.getByLabelText('Datum för luftpistolserie')).toBeInTheDocument()
    })

    test('renders points input field', () => {
      renderForm()
      expect(screen.getByLabelText('Poäng i luftpistolserie')).toBeInTheDocument()
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
      const dateInput = screen.getByLabelText('Datum för luftpistolserie')
      expect(dateInput.value).toBe(today)
    })

    test('pre-populates points from medal requirements', () => {
      const { getAirPistolPrecisionDefaults } = require('../src/utils/requirementDefaults')
      getAirPistolPrecisionDefaults.mockReturnValue({
        minPointsPerSeries: 85,
        minSeries: 5,
      })

      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      expect(pointsInput.value).toBe('85')
    })
  })

  describe('validation', () => {
    test('shows error when date is empty', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för luftpistolserie')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Datum krävs')).toBeInTheDocument()
      })
    })

    test('shows error when points is empty', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Poäng krävs')).toBeInTheDocument()
      })
    })

    test('shows error when points is negative', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '-5', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Poäng måste vara mellan 0-100')).toBeInTheDocument()
      })
    })

    test('shows error when points exceeds 100', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '105', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Poäng måste vara mellan 0-100')).toBeInTheDocument()
      })
    })

    test('accepts valid points value of 0', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '0', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    test('accepts valid points value of 100', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '100', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('save flows', () => {
    test('shows validation error and prevents submission with invalid data', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
      fireEvent.change(pointsInput, { target: { value: '150', name: 'points' } }) // Invalid: exceeds 100
      fireEvent.click(screen.getByText('Spara & Lägg till fler'))

      await waitFor(() => {
        expect(screen.getByText('Poäng måste vara mellan 0-100')).toBeInTheDocument()
      })
      expect(mockOnSubmitAndAddAnother).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    test('date input has aria-invalid when error exists', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för luftpistolserie')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(dateInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('points input has aria-invalid when error exists', async () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Poäng i luftpistolserie')
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
