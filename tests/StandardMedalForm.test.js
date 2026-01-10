import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StandardMedalForm from '../src/components/form/StandardMedalForm'

// Mock the hooks and utilities
jest.mock('../src/utils/requirementDefaults', () => ({
  getStandardMedalDefaults: jest.fn(() => ({
    disciplineType: '',
    medalType: '',
  })),
  getRequirementHint: jest.fn(() => null),
}))

describe('StandardMedalForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSubmitAndAddAnother = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderForm = (props = {}) => {
    return render(
      <StandardMedalForm
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
      expect(screen.getByLabelText('Datum för standardmedalj')).toBeInTheDocument()
    })

    test('renders discipline dropdown', () => {
      renderForm()
      expect(screen.getByLabelText('Välj disciplin')).toBeInTheDocument()
    })

    test('renders medal type dropdown', () => {
      renderForm()
      expect(screen.getByLabelText('Välj medaljnivå')).toBeInTheDocument()
    })

    test('renders submit buttons', () => {
      renderForm()
      expect(screen.getByText('Spara & Stäng')).toBeInTheDocument()
      expect(screen.getByText('Spara & Lägg till fler')).toBeInTheDocument()
    })

    test('renders loading state on buttons', () => {
      renderForm({ loading: true })
      // Both buttons show loading text
      const loadingTexts = screen.getAllByText('Sparar...')
      expect(loadingTexts.length).toBeGreaterThanOrEqual(1)
    })

    test('renders discipline options', () => {
      renderForm()
      expect(screen.getByText('Fält')).toBeInTheDocument()
      expect(screen.getByText('Precision')).toBeInTheDocument()
      expect(screen.getByText('PPC')).toBeInTheDocument()
    })

    test('renders medal type options', () => {
      renderForm()
      expect(screen.getByText('Brons')).toBeInTheDocument()
      expect(screen.getByText('Silver')).toBeInTheDocument()
      expect(screen.getByText('Guld')).toBeInTheDocument()
    })
  })

  describe('default values', () => {
    test('initializes with today date', () => {
      renderForm()
      const today = new Date().toISOString().split('T')[0]
      const dateInput = screen.getByLabelText('Datum för standardmedalj')
      expect(dateInput.value).toBe(today)
    })

    test('pre-selects discipline from medal requirements', () => {
      const { getStandardMedalDefaults } = require('../src/utils/requirementDefaults')
      getStandardMedalDefaults.mockReturnValue({
        disciplineType: 'field',
        medalType: '',
      })

      renderForm()
      // Should show locked discipline instead of dropdown
      expect(screen.getByText(/Fält/)).toBeInTheDocument()
      expect(screen.getByText(/bestämt av märkeskrav/i)).toBeInTheDocument()
    })

    test('shows requirement hint when available', () => {
      const { getRequirementHint } = require('../src/utils/requirementDefaults')
      getRequirementHint.mockReturnValue('Fältmedalj i vapengrupp A-C')

      renderForm()
      expect(screen.getByText('Fältmedalj i vapengrupp A-C')).toBeInTheDocument()
    })
  })

  describe('discipline locking', () => {
    test('locks discipline when auto-detected from medal', () => {
      const { getStandardMedalDefaults, getRequirementHint } = require('../src/utils/requirementDefaults')
      getStandardMedalDefaults.mockReturnValue({
        disciplineType: 'field',
        medalType: '',
      })
      getRequirementHint.mockReturnValue(null) // Clear hint to avoid duplicate text

      renderForm()
      // Should not show dropdown, but locked display
      expect(screen.queryByRole('combobox', { name: /välj disciplin/i })).not.toBeInTheDocument()
      expect(screen.getByText(/bestämt av märkeskrav/i)).toBeInTheDocument()
    })

    test('shows discipline dropdown when not auto-detected', () => {
      const { getStandardMedalDefaults, getRequirementHint } = require('../src/utils/requirementDefaults')
      getStandardMedalDefaults.mockReturnValue({
        disciplineType: '',
        medalType: '',
      })
      getRequirementHint.mockReturnValue(null)

      renderForm()
      expect(screen.getByLabelText('Välj disciplin')).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    test('shows error when date is empty', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för standardmedalj')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Datum krävs')).toBeInTheDocument()
      })
    })

    test('shows error when discipline is not selected', async () => {
      renderForm()
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Välj en disciplin')).toBeInTheDocument()
      })
    })

    test('shows error when medal type is not selected', async () => {
      renderForm()
      const disciplineSelect = screen.getByLabelText('Välj disciplin')
      fireEvent.change(disciplineSelect, { target: { value: 'field', name: 'disciplineType' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(screen.getByText('Välj medaljnivå')).toBeInTheDocument()
      })
    })

    test('accepts all valid medal types', async () => {
      renderForm()
      const disciplineSelect = screen.getByLabelText('Välj disciplin')
      const medalTypeSelect = screen.getByLabelText('Välj medaljnivå')

      fireEvent.change(disciplineSelect, { target: { value: 'field', name: 'disciplineType' } })
      fireEvent.change(medalTypeSelect, { target: { value: 'bronze', name: 'medalType' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            medalType: 'bronze',
          })
        )
      })
    })
  })

  describe('save flows', () => {
    test('calls onSubmit with correct data when form is valid', async () => {
      renderForm()
      const disciplineSelect = screen.getByLabelText('Välj disciplin')
      const medalTypeSelect = screen.getByLabelText('Välj medaljnivå')

      fireEvent.change(disciplineSelect, { target: { value: 'field', name: 'disciplineType' } })
      fireEvent.change(medalTypeSelect, { target: { value: 'silver', name: 'medalType' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            disciplineType: 'field',
            medalType: 'silver',
            achievementType: 'standard_medal',
          })
        )
      })
    })

    test('calls onSubmitAndAddAnother when that button is clicked', async () => {
      renderForm()
      const disciplineSelect = screen.getByLabelText('Välj disciplin')
      const medalTypeSelect = screen.getByLabelText('Välj medaljnivå')

      fireEvent.change(disciplineSelect, { target: { value: 'precision', name: 'disciplineType' } })
      fireEvent.change(medalTypeSelect, { target: { value: 'gold', name: 'medalType' } })
      fireEvent.click(screen.getByText('Spara & Lägg till fler'))

      await waitFor(() => {
        expect(mockOnSubmitAndAddAnother).toHaveBeenCalledWith(
          expect.objectContaining({
            disciplineType: 'precision',
            medalType: 'gold',
            achievementType: 'standard_medal',
          })
        )
      })
    })

    test('does not call onSubmitAndAddAnother when validation fails', async () => {
      renderForm()
      fireEvent.click(screen.getByText('Spara & Lägg till fler'))

      await waitFor(() => {
        expect(mockOnSubmitAndAddAnother).not.toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    test('date input has aria-invalid when error exists', async () => {
      renderForm()
      const dateInput = screen.getByLabelText('Datum för standardmedalj')
      fireEvent.change(dateInput, { target: { value: '', name: 'date' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        expect(dateInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('discipline select has aria-invalid when error exists', async () => {
      renderForm()
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        const disciplineSelect = screen.getByLabelText('Välj disciplin')
        expect(disciplineSelect).toHaveAttribute('aria-invalid', 'true')
      })
    })

    test('medal type select has aria-invalid when error exists', async () => {
      renderForm()
      const disciplineSelect = screen.getByLabelText('Välj disciplin')
      fireEvent.change(disciplineSelect, { target: { value: 'field', name: 'disciplineType' } })
      fireEvent.click(screen.getByText('Spara & Stäng'))

      await waitFor(() => {
        const medalTypeSelect = screen.getByLabelText('Välj medaljnivå')
        expect(medalTypeSelect).toHaveAttribute('aria-invalid', 'true')
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
