import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import BackupPreferences from '../src/components/BackupPreferences.jsx'
import * as backupScheduler from '../src/utils/backupScheduler.js'

// Mock dependencies
jest.mock('../src/hooks/useBackup', () => ({
  useBackup: jest.fn()
}))

jest.mock('../src/utils/backupScheduler', () => ({
  formatLastBackupDate: jest.fn()
}))

const { useBackup } = require('../src/hooks/useBackup')

describe('BackupPreferences', () => {
  let mockBackupContext

  beforeEach(() => {
    jest.clearAllMocks()

    mockBackupContext = {
      reminderFrequency: 30,
      updateReminderFrequency: jest.fn(),
      lastBackupDate: '2026-01-01T12:00:00Z'
    }

    useBackup.mockReturnValue(mockBackupContext)
    backupScheduler.formatLastBackupDate.mockReturnValue('1 jan. 2026, 12:00')
  })

  describe('rendering', () => {
    test('renders heading and description', () => {
      render(<BackupPreferences />)

      expect(screen.getByText('Säkerhetskopieringspåminnelser')).toBeInTheDocument()
      expect(screen.getByText(/Få påminnelser om att säkerhetskopiera/)).toBeInTheDocument()
    })

    test('renders all frequency options', () => {
      render(<BackupPreferences />)

      expect(screen.getByText('Påminn mig aldrig')).toBeInTheDocument()
      expect(screen.getByText('Jag säkerhetskopierar manuellt')).toBeInTheDocument()

      expect(screen.getByText('Var 30:e dag')).toBeInTheDocument()
      expect(screen.getByText('Rekommenderas för de flesta användare')).toBeInTheDocument()

      expect(screen.getByText('Var 90:e dag')).toBeInTheDocument()
      expect(screen.getByText('För avancerade användare')).toBeInTheDocument()
    })

    test('displays formatted last backup date', () => {
      render(<BackupPreferences />)

      expect(screen.getByText(/Senaste säkerhetskopia:/)).toBeInTheDocument()
      expect(screen.getByText('1 jan. 2026, 12:00')).toBeInTheDocument()
      expect(backupScheduler.formatLastBackupDate).toHaveBeenCalledWith('2026-01-01T12:00:00Z')
    })

    test('displays educational tips', () => {
      render(<BackupPreferences />)

      expect(screen.getByText('Så håller du dina uppgifter säkra')).toBeInTheDocument()
      expect(screen.getByText(/Din data finns bara på den här enheten/)).toBeInTheDocument()
      expect(screen.getByText(/Exportera regelbundet/)).toBeInTheDocument()
      expect(screen.getByText(/Lagra säkerhetskopior i iCloud Drive/)).toBeInTheDocument()
      expect(screen.getByText(/Flera säkerhetskopior = extra säkerhet/)).toBeInTheDocument()
    })
  })

  describe('frequency selection', () => {
    test('shows current selection as checked', () => {
      mockBackupContext.reminderFrequency = 30
      useBackup.mockReturnValue(mockBackupContext)

      render(<BackupPreferences />)

      const radios = screen.getAllByRole('radio')
      expect(radios[0]).not.toBeChecked() // Never
      expect(radios[1]).toBeChecked() // 30 days
      expect(radios[2]).not.toBeChecked() // 90 days
    })

    test('calls updateReminderFrequency when option selected', () => {
      render(<BackupPreferences />)

      const neverOption = screen.getByLabelText(/Påminn mig aldrig/)
      fireEvent.click(neverOption)

      expect(mockBackupContext.updateReminderFrequency).toHaveBeenCalledWith(0)
    })

    test('can select 30 days option', () => {
      mockBackupContext.reminderFrequency = 0
      useBackup.mockReturnValue(mockBackupContext)

      render(<BackupPreferences />)

      const thirtyDaysOption = screen.getByLabelText(/Var 30:e dag/)
      fireEvent.click(thirtyDaysOption)

      expect(mockBackupContext.updateReminderFrequency).toHaveBeenCalledWith(30)
    })

    test('can select 90 days option', () => {
      mockBackupContext.reminderFrequency = 30
      useBackup.mockReturnValue(mockBackupContext)

      render(<BackupPreferences />)

      const ninetyDaysOption = screen.getByLabelText(/Var 90:e dag/)
      fireEvent.click(ninetyDaysOption)

      expect(mockBackupContext.updateReminderFrequency).toHaveBeenCalledWith(90)
    })

    test('highlights selected option with visual styling', () => {
      mockBackupContext.reminderFrequency = 30
      useBackup.mockReturnValue(mockBackupContext)

      render(<BackupPreferences />)

      // Find the option container by traversing up from the label text
      const thirtyDaysLabel = screen.getByText('Var 30:e dag')
      const thirtyDaysContainer = thirtyDaysLabel.closest('.border-2')

      expect(thirtyDaysContainer).toHaveClass('border-color-primary')
      expect(thirtyDaysContainer).toHaveClass('bg-blue-50')
    })
  })

  describe('accessibility', () => {
    test('has fieldset with legend for radio group', () => {
      const { container } = render(<BackupPreferences />)

      const fieldset = container.querySelector('fieldset')
      expect(fieldset).toBeInTheDocument()

      const legend = container.querySelector('legend')
      expect(legend).toBeInTheDocument()
      expect(legend).toHaveClass('sr-only')
      expect(legend).toHaveTextContent('Frekvens för säkerhetskopieringspåminnelser')
    })

    test('radio buttons are properly labeled', () => {
      render(<BackupPreferences />)

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)

      radios.forEach((radio) => {
        expect(radio).toHaveAttribute('name', 'backup-frequency')
      })
    })

    test('icons are marked as decorative', () => {
      const { container } = render(<BackupPreferences />)

      const icons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })

    test('has focus-visible styles on radio buttons', () => {
      const { container } = render(<BackupPreferences />)

      const radio = container.querySelector('input[type="radio"]')
      expect(radio).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('last backup date handling', () => {
    test('displays "Aldrig" when never backed up', () => {
      mockBackupContext.lastBackupDate = null
      useBackup.mockReturnValue(mockBackupContext)
      backupScheduler.formatLastBackupDate.mockReturnValue('Aldrig')

      render(<BackupPreferences />)

      expect(screen.getByText('Aldrig')).toBeInTheDocument()
      expect(backupScheduler.formatLastBackupDate).toHaveBeenCalledWith(null)
    })

    test('formats date with Swedish locale', () => {
      mockBackupContext.lastBackupDate = '2025-12-25T18:30:00Z'
      useBackup.mockReturnValue(mockBackupContext)
      backupScheduler.formatLastBackupDate.mockReturnValue('25 dec. 2025, 18:30')

      render(<BackupPreferences />)

      expect(screen.getByText('25 dec. 2025, 18:30')).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    test('option containers have hover styles', () => {
      mockBackupContext.reminderFrequency = 0
      useBackup.mockReturnValue(mockBackupContext)

      render(<BackupPreferences />)

      const thirtyDaysLabel = screen.getByText('Var 30:e dag')
      const thirtyDaysContainer = thirtyDaysLabel.closest('.border-2')

      expect(thirtyDaysContainer).toHaveClass('hover:border-color-primary/50')
    })
  })
})
