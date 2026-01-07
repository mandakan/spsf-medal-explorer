import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { BackupProvider } from '../src/contexts/BackupContext.jsx'
import { useBackup } from '../src/hooks/useBackup.js'
import * as backupScheduler from '../src/utils/backupScheduler.js'

// Mock useStorage hook
jest.mock('../src/hooks/useStorage', () => ({
  useStorage: jest.fn()
}))

const { useStorage } = require('../src/hooks/useStorage')

// Test probe component that uses the backup context
function BackupProbe() {
  const backup = useBackup()
  return (
    <div>
      <div data-testid="isLoading">{String(backup.isLoading)}</div>
      <div data-testid="lastBackupDate">{backup.lastBackupDate || 'null'}</div>
      <div data-testid="lastDataChange">{backup.lastDataChange || 'null'}</div>
      <div data-testid="reminderFrequency">{backup.reminderFrequency}</div>
      <div data-testid="shouldShowReminder">{String(backup.shouldShowReminder)}</div>

      <button onClick={() => backup.markBackupCreated()}>Mark Backup</button>
      <button onClick={() => backup.markDataChanged()}>Mark Data Changed</button>
      <button onClick={() => backup.updateReminderFrequency(90)}>Set 90 Days</button>
      <button onClick={() => backup.dismissReminder()}>Dismiss</button>
    </div>
  )
}

describe('BackupContext', () => {
  let mockManager

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock manager with metadata storage
    mockManager = {
      getMetadata: jest.fn(),
      setMetadata: jest.fn()
    }

    useStorage.mockReturnValue({ manager: mockManager })
  })

  describe('initialization', () => {
    test('loads metadata from storage manager on mount', async () => {
      mockManager.getMetadata.mockImplementation((key) => {
        const metadata = {
          lastBackupDate: '2026-01-01T12:00:00Z',
          lastDataChange: '2026-01-06T12:00:00Z',
          backupReminderFrequency: 30,
          reminderDismissedUntil: null
        }
        return Promise.resolve(metadata[key])
      })

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('lastBackupDate')).toHaveTextContent('2026-01-01T12:00:00Z')
      expect(screen.getByTestId('lastDataChange')).toHaveTextContent('2026-01-06T12:00:00Z')
      expect(screen.getByTestId('reminderFrequency')).toHaveTextContent('30')
    })

    test('uses default values when no metadata exists', async () => {
      mockManager.getMetadata.mockResolvedValue(null)

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('lastBackupDate')).toHaveTextContent('null')
      expect(screen.getByTestId('lastDataChange')).toHaveTextContent('null')
      expect(screen.getByTestId('reminderFrequency')).toHaveTextContent('30')
    })

    test('handles storage errors gracefully', async () => {
      mockManager.getMetadata.mockRejectedValue(new Error('Storage error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load backup metadata:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('markBackupCreated', () => {
    test('updates lastBackupDate to current time', async () => {
      mockManager.getMetadata.mockResolvedValue(null)
      mockManager.setMetadata.mockResolvedValue(undefined)

      const now = new Date('2026-01-07T12:00:00Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Mark Backup').click()
      })

      await waitFor(() => {
        const content = screen.getByTestId('lastBackupDate').textContent
        expect(content).toMatch(/2026-01-07T12:00:00/)
      })

      expect(mockManager.setMetadata).toHaveBeenCalledWith(
        'lastBackupDate',
        expect.stringMatching(/2026-01-07T12:00:00/)
      )

      jest.useRealTimers()
    })

    test('handles save errors gracefully', async () => {
      mockManager.getMetadata.mockResolvedValue(null)
      mockManager.setMetadata.mockRejectedValue(new Error('Save error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Mark Backup').click()
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save lastBackupDate:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('markDataChanged', () => {
    test('updates lastDataChange to current time', async () => {
      mockManager.getMetadata.mockResolvedValue(null)
      mockManager.setMetadata.mockResolvedValue(undefined)

      const now = new Date('2026-01-07T14:30:00Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Mark Data Changed').click()
      })

      await waitFor(() => {
        const content = screen.getByTestId('lastDataChange').textContent
        expect(content).toMatch(/2026-01-07T14:30:00/)
      })

      expect(mockManager.setMetadata).toHaveBeenCalledWith(
        'lastDataChange',
        expect.stringMatching(/2026-01-07T14:30:00/)
      )

      jest.useRealTimers()
    })
  })

  describe('updateReminderFrequency', () => {
    test('updates reminder frequency preference', async () => {
      mockManager.getMetadata.mockResolvedValue(null)
      mockManager.setMetadata.mockResolvedValue(undefined)

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      expect(screen.getByTestId('reminderFrequency')).toHaveTextContent('30')

      await act(async () => {
        screen.getByText('Set 90 Days').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reminderFrequency')).toHaveTextContent('90')
      })

      expect(mockManager.setMetadata).toHaveBeenCalledWith(
        'backupReminderFrequency',
        90
      )
    })
  })

  describe('dismissReminder', () => {
    test('sets dismissal date 7 days in the future', async () => {
      mockManager.getMetadata.mockResolvedValue(null)
      mockManager.setMetadata.mockResolvedValue(undefined)

      const now = new Date('2026-01-07T12:00:00Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Dismiss').click()
      })

      await waitFor(() => {
        expect(mockManager.setMetadata).toHaveBeenCalledWith(
          'reminderDismissedUntil',
          expect.stringContaining('2026-01-14')
        )
      })

      jest.useRealTimers()
    })
  })

  describe('shouldShowReminder', () => {
    test('uses backupScheduler logic to calculate reminder state', async () => {
      const spy = jest.spyOn(backupScheduler, 'shouldShowReminder')
      spy.mockReturnValue(true)

      mockManager.getMetadata.mockImplementation((key) => {
        const metadata = {
          lastBackupDate: '2025-12-01T12:00:00Z',
          lastDataChange: '2026-01-06T12:00:00Z',
          backupReminderFrequency: 30,
          reminderDismissedUntil: null
        }
        return Promise.resolve(metadata[key])
      })

      render(
        <BackupProvider>
          <BackupProbe />
        </BackupProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      await waitFor(() => {
        expect(screen.getByTestId('shouldShowReminder')).toHaveTextContent('true')
      })

      expect(spy).toHaveBeenCalledWith({
        lastBackupDate: '2025-12-01T12:00:00Z',
        lastDataChange: '2026-01-06T12:00:00Z',
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })

      spy.mockRestore()
    })
  })

  describe('useBackup hook', () => {
    test('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<BackupProbe />)
      }).toThrow('useBackup must be used within BackupProvider')

      consoleSpy.mockRestore()
    })
  })
})
