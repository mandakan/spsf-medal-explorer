import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import BackupReminder from '../src/components/BackupReminder'
import * as exportManager from '../src/utils/exportManager'
import * as fileHandlers from '../src/utils/fileHandlers'

// Mock dependencies
jest.mock('../src/hooks/useBackup', () => ({
  useBackup: jest.fn()
}))

jest.mock('../src/hooks/useProfile', () => ({
  useProfile: jest.fn()
}))

jest.mock('../src/utils/exportManager', () => ({
  toProfileBackup: jest.fn()
}))

jest.mock('../src/utils/fileHandlers', () => ({
  downloadFile: jest.fn()
}))

const { useBackup } = require('../src/hooks/useBackup')
const { useProfile } = require('../src/hooks/useProfile')

describe('BackupReminder', () => {
  let mockBackupContext
  let mockProfileContext

  beforeEach(() => {
    jest.clearAllMocks()

    mockBackupContext = {
      shouldShowReminder: true,
      dismissReminder: jest.fn(),
      markBackupCreated: jest.fn()
    }

    mockProfileContext = {
      currentProfile: {
        userId: 'user-123',
        displayName: 'Test User',
        unlockedMedals: []
      }
    }

    useBackup.mockReturnValue(mockBackupContext)
    useProfile.mockReturnValue(mockProfileContext)
  })

  describe('visibility', () => {
    test('renders when shouldShowReminder is true and profile exists', () => {
      render(<BackupReminder />)

      expect(screen.getByText('Dags att säkerhetskopiera dina uppgifter')).toBeInTheDocument()
      expect(screen.getByText(/Din data finns bara på den här enheten/)).toBeInTheDocument()
    })

    test('does not render when shouldShowReminder is false', () => {
      mockBackupContext.shouldShowReminder = false
      useBackup.mockReturnValue(mockBackupContext)

      const { container } = render(<BackupReminder />)

      expect(container).toBeEmptyDOMElement()
    })

    test('does not render when no current profile', () => {
      mockProfileContext.currentProfile = null
      useProfile.mockReturnValue(mockProfileContext)

      const { container } = render(<BackupReminder />)

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('backup action', () => {
    test('triggers backup and marks as created when button clicked', async () => {
      const mockBackupData = JSON.stringify({ kind: 'profile-backup' })

      exportManager.toProfileBackup.mockResolvedValue(mockBackupData)
      fileHandlers.downloadFile.mockImplementation(() => {})
      mockBackupContext.markBackupCreated.mockResolvedValue(undefined)

      render(<BackupReminder />)

      const backupButton = screen.getByRole('button', { name: /Säkerhetskopiera nu/i })
      fireEvent.click(backupButton)

      await waitFor(() => {
        expect(exportManager.toProfileBackup).toHaveBeenCalledWith(
          mockProfileContext.currentProfile,
          { version: '1.0' }
        )
      })

      expect(fileHandlers.downloadFile).toHaveBeenCalledWith(
        mockBackupData,
        expect.stringMatching(/medal-backup-\d{4}-\d{2}-\d{2}\.json/),
        'application/json'
      )

      expect(mockBackupContext.markBackupCreated).toHaveBeenCalled()
    })

    test('shows loading state during backup', async () => {
      exportManager.toProfileBackup.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('{}'), 100))
      )
      fileHandlers.downloadFile.mockImplementation(() => {})

      render(<BackupReminder />)

      const backupButton = screen.getByRole('button', { name: /Säkerhetskopiera nu/i })
      fireEvent.click(backupButton)

      expect(screen.getByText('Säkerhetskopierar...')).toBeInTheDocument()
      expect(backupButton).toBeDisabled()

      await waitFor(() => {
        expect(screen.getByText('Säkerhetskopiera nu')).toBeInTheDocument()
      })
    })

    test('handles backup errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      exportManager.toProfileBackup.mockRejectedValue(new Error('Backup failed'))

      render(<BackupReminder />)

      const backupButton = screen.getByRole('button', { name: /Säkerhetskopiera nu/i })
      fireEvent.click(backupButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Backup error:', expect.any(Error))
      })

      // Should not mark as created on error
      expect(mockBackupContext.markBackupCreated).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('dismiss action', () => {
    test('calls dismissReminder when Later button clicked', async () => {
      mockBackupContext.dismissReminder.mockResolvedValue(undefined)

      render(<BackupReminder />)

      const dismissButton = screen.getByRole('button', { name: 'Påminn mig om 7 dagar' })
      fireEvent.click(dismissButton)

      await waitFor(() => {
        expect(mockBackupContext.dismissReminder).toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    test('has role="status" and aria-live="polite"', () => {
      const { container } = render(<BackupReminder />)

      const banner = container.querySelector('[role="status"]')
      expect(banner).toBeInTheDocument()
      expect(banner).toHaveAttribute('aria-live', 'polite')
    })

    test('has aria-label on dismiss button', () => {
      render(<BackupReminder />)

      const dismissButton = screen.getByRole('button', { name: 'Påminn mig om 7 dagar' })
      expect(dismissButton).toBeInTheDocument()
    })

    test('icons are marked as decorative with aria-hidden', () => {
      const { container } = render(<BackupReminder />)

      const icons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })

    test('buttons have minimum touch target size', () => {
      render(<BackupReminder />)

      const backupButton = screen.getByRole('button', { name: /Säkerhetskopiera nu/i })
      const dismissButton = screen.getByRole('button', { name: 'Påminn mig om 7 dagar' })

      expect(backupButton).toHaveClass('min-h-[44px]')
      expect(dismissButton).toHaveClass('min-h-[44px]')
    })
  })

  describe('responsive design', () => {
    test('has responsive layout classes', () => {
      const { container } = render(<BackupReminder />)

      const mainContainer = container.querySelector('.flex')
      expect(mainContainer).toHaveClass('flex-col', 'sm:flex-row')
    })

    test('buttons are full width on mobile, auto on desktop', () => {
      render(<BackupReminder />)

      const buttonContainer = screen.getByRole('button', { name: /Säkerhetskopiera nu/i }).parentElement
      expect(buttonContainer).toHaveClass('w-full', 'sm:w-auto')
    })
  })
})
