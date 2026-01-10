import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CompetitionPerformanceForm from '../src/components/form/CompetitionPerformanceForm'

// Mock the hooks and utilities
jest.mock('../src/hooks/useProfile', () => ({
  useProfile: () => ({ currentProfile: { sex: 'male' } }),
}))

jest.mock('../src/utils/requirementDefaults', () => ({
  getCompetitionPerformanceDefaults: jest.fn(() => ({
    disciplineType: '',
    weaponGroup: 'A',
    maxPoints: null,
    thresholds: null,
  })),
  getRequirementHint: jest.fn(() => null),
}))

describe('CompetitionPerformanceForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSubmitAndAddAnother = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mocks to default state before each test
    const { getCompetitionPerformanceDefaults, getRequirementHint } = require('../src/utils/requirementDefaults')
    getCompetitionPerformanceDefaults.mockReturnValue({
      disciplineType: '',
      weaponGroup: 'A',
      maxPoints: null,
      thresholds: null,
    })
    getRequirementHint.mockReturnValue(null)
  })

  const renderForm = (props = {}) => {
    return render(
      <CompetitionPerformanceForm
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
      expect(screen.getByLabelText('Datum för tävling')).toBeInTheDocument()
    })

    test('renders discipline radio buttons when not locked', () => {
      renderForm()
      expect(screen.getByText('Fältskytte')).toBeInTheDocument()
      expect(screen.getByText('Terränglöpning/springskytte')).toBeInTheDocument()
    })

    test('renders submit buttons', () => {
      renderForm()
      expect(screen.getByText('Spara & Stäng')).toBeInTheDocument()
      expect(screen.getByText('Spara & Lägg till fler')).toBeInTheDocument()
    })
  })

  describe('discipline auto-detection', () => {
    test('locks discipline when auto-detected from medal', () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: { A: { min: 70 } },
      })

      renderForm()
      // Should show locked discipline name instead of radio buttons
      expect(screen.getByText(/Fältskytte/)).toBeInTheDocument()
      // Radio buttons should not be present
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    })

    test('shows discipline selector when not auto-detected', () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: '',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      expect(screen.getByRole('radio', { name: /fältskytte/i })).toBeInTheDocument()
    })
  })

  describe('field shooting fields', () => {
    beforeEach(() => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: { A: { min: 70 } },
      })
    })

    test('shows weapon group selector for field shooting', () => {
      renderForm()
      expect(screen.getByLabelText('Vapengrupp')).toBeInTheDocument()
    })

    test('shows score and maxScore inputs for field shooting', () => {
      renderForm()
      expect(screen.getByLabelText('Uppnådd poäng')).toBeInTheDocument()
      expect(screen.getByLabelText('Maxpoäng')).toBeInTheDocument()
    })

    test('displays calculated percentage', async () => {
      renderForm()
      const scoreInput = screen.getByLabelText('Uppnådd poäng')
      const maxScoreInput = screen.getByLabelText('Maxpoäng')

      fireEvent.change(scoreInput, { target: { value: '45', name: 'score' } })
      fireEvent.change(maxScoreInput, { target: { value: '60', name: 'maxScore' } })

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })
  })

  describe('running/skiing fields', () => {
    beforeEach(() => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'running',
        weaponGroup: 'A',
        maxPoints: 50,
        thresholds: null,
      })
    })

    test('shows points input for running discipline', () => {
      renderForm()
      expect(screen.getByLabelText('Totalpoäng')).toBeInTheDocument()
    })

    test('pre-populates points with maxPoints from requirements', () => {
      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      expect(pointsInput.value).toBe('50')
    })

    test('does not show weapon group for running discipline', () => {
      renderForm()
      expect(screen.queryByLabelText('Vapengrupp')).not.toBeInTheDocument()
    })
  })

  describe('validation', () => {
    test('shows error when discipline not selected', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: '',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Disciplin krävs')).toBeInTheDocument()
      })
    })

    test('shows error when field score is empty', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Uppnådd poäng krävs (0 eller högre)')).toBeInTheDocument()
      })
    })

    test('shows error when field maxScore is empty', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      const scoreInput = screen.getByLabelText('Uppnådd poäng')
      fireEvent.change(scoreInput, { target: { value: '50', name: 'score' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Maxpoäng krävs (större än 0)')).toBeInTheDocument()
      })
    })

    test('shows error when score exceeds maxScore', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      const scoreInput = screen.getByLabelText('Uppnådd poäng')
      const maxScoreInput = screen.getByLabelText('Maxpoäng')
      fireEvent.change(scoreInput, { target: { value: '70', name: 'score' } })
      fireEvent.change(maxScoreInput, { target: { value: '60', name: 'maxScore' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Uppnådd poäng kan inte vara högre än maxpoäng')).toBeInTheDocument()
      })
    })

    test('shows error when running points is empty', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'running',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      const pointsInput = screen.getByLabelText('Totalpoäng')
      fireEvent.change(pointsInput, { target: { value: '', name: 'points' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Totalpoäng krävs (0 eller högre)')).toBeInTheDocument()
      })
    })
  })

  describe('save flows', () => {
    test('calculates and displays score percentage for field shooting', async () => {
      const { getCompetitionPerformanceDefaults } = require('../src/utils/requirementDefaults')
      getCompetitionPerformanceDefaults.mockReturnValue({
        disciplineType: 'field',
        weaponGroup: 'A',
        maxPoints: null,
        thresholds: null,
      })

      renderForm()
      const scoreInput = screen.getByLabelText('Uppnådd poäng')
      const maxScoreInput = screen.getByLabelText('Maxpoäng')
      fireEvent.change(scoreInput, { target: { value: '45', name: 'score' } })
      fireEvent.change(maxScoreInput, { target: { value: '60', name: 'maxScore' } })

      // Should display calculated percentage
      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
    })
  })
})
