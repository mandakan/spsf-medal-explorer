import {
  shouldShowReminder,
  calculateDaysBetween,
  calculateDismissUntilDate,
  formatLastBackupDate
} from '../src/utils/backupScheduler'

describe('backupScheduler', () => {
  describe('shouldShowReminder', () => {
    const now = new Date('2026-01-07T12:00:00Z')
    const yesterday = new Date('2026-01-06T12:00:00Z').toISOString()
    const thirtyDaysAgo = new Date('2025-12-08T12:00:00Z').toISOString()
    const ninetyDaysAgo = new Date('2025-10-09T12:00:00Z').toISOString()

    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(now)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    test('returns false when reminderFrequency is 0 (never)', () => {
      const result = shouldShowReminder({
        lastBackupDate: thirtyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 0,
        reminderDismissedUntil: null
      })
      expect(result).toBe(false)
    })

    test('returns false when reminder is dismissed and not yet expired', () => {
      const tomorrow = new Date('2026-01-08T12:00:00Z').toISOString()
      const result = shouldShowReminder({
        lastBackupDate: thirtyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 30,
        reminderDismissedUntil: tomorrow
      })
      expect(result).toBe(false)
    })

    test('returns true when reminder dismissal has expired', () => {
      const twoDaysAgo = new Date('2026-01-05T12:00:00Z').toISOString()
      const result = shouldShowReminder({
        lastBackupDate: thirtyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 30,
        reminderDismissedUntil: twoDaysAgo
      })
      expect(result).toBe(true)
    })

    test('returns false when no data has changed', () => {
      const result = shouldShowReminder({
        lastBackupDate: thirtyDaysAgo,
        lastDataChange: null,
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })
      expect(result).toBe(false)
    })

    test('returns true when never backed up but data exists', () => {
      const result = shouldShowReminder({
        lastBackupDate: null,
        lastDataChange: yesterday,
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })
      expect(result).toBe(true)
    })

    test('returns false when data has not changed since last backup', () => {
      const result = shouldShowReminder({
        lastBackupDate: yesterday,
        lastDataChange: thirtyDaysAgo,
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })
      expect(result).toBe(false)
    })

    test('returns true when 30+ days since backup and data changed', () => {
      const result = shouldShowReminder({
        lastBackupDate: thirtyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })
      expect(result).toBe(true)
    })

    test('returns false when less than 30 days since backup', () => {
      const twentyDaysAgo = new Date('2025-12-18T12:00:00Z').toISOString()
      const result = shouldShowReminder({
        lastBackupDate: twentyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 30,
        reminderDismissedUntil: null
      })
      expect(result).toBe(false)
    })

    test('returns true when 90+ days since backup and data changed', () => {
      const result = shouldShowReminder({
        lastBackupDate: ninetyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 90,
        reminderDismissedUntil: null
      })
      expect(result).toBe(true)
    })

    test('returns false when less than 90 days since backup', () => {
      const eightyDaysAgo = new Date('2025-10-19T12:00:00Z').toISOString()
      const result = shouldShowReminder({
        lastBackupDate: eightyDaysAgo,
        lastDataChange: yesterday,
        reminderFrequency: 90,
        reminderDismissedUntil: null
      })
      expect(result).toBe(false)
    })
  })

  describe('calculateDaysBetween', () => {
    test('returns 0 for same date', () => {
      const date = new Date('2026-01-07T12:00:00Z')
      const result = calculateDaysBetween(date, date)
      expect(result).toBe(0)
    })

    test('returns 1 for consecutive days', () => {
      const start = new Date('2026-01-06T12:00:00Z')
      const end = new Date('2026-01-07T12:00:00Z')
      const result = calculateDaysBetween(start, end)
      expect(result).toBe(1)
    })

    test('returns 30 for dates 30 days apart', () => {
      const start = new Date('2025-12-08T12:00:00Z')
      const end = new Date('2026-01-07T12:00:00Z')
      const result = calculateDaysBetween(start, end)
      expect(result).toBe(30)
    })

    test('returns 90 for dates 90 days apart', () => {
      const start = new Date('2025-10-09T12:00:00Z')
      const end = new Date('2026-01-07T12:00:00Z')
      const result = calculateDaysBetween(start, end)
      expect(result).toBe(90)
    })

    test('floors partial days', () => {
      const start = new Date('2026-01-06T12:00:00Z')
      const end = new Date('2026-01-07T18:00:00Z') // 1.25 days
      const result = calculateDaysBetween(start, end)
      expect(result).toBe(1)
    })
  })

  describe('calculateDismissUntilDate', () => {
    test('returns ISO date string 7 days in the future from now', () => {
      const now = new Date('2026-01-07T12:00:00Z')
      const result = calculateDismissUntilDate(now)
      const parsed = new Date(result)
      const expected = new Date('2026-01-14T12:00:00Z')
      expect(parsed.toISOString()).toBe(expected.toISOString())
    })

    test('returns ISO date string 7 days from custom date', () => {
      const customDate = new Date('2025-12-25T00:00:00Z')
      const result = calculateDismissUntilDate(customDate)
      const parsed = new Date(result)
      const expected = new Date('2026-01-01T00:00:00Z')
      expect(parsed.toISOString()).toBe(expected.toISOString())
    })

    test('uses current date when no argument provided', () => {
      const now = new Date('2026-01-07T12:00:00Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      const result = calculateDismissUntilDate()
      const parsed = new Date(result)
      const expected = new Date('2026-01-14T12:00:00Z')
      expect(parsed.toISOString()).toBe(expected.toISOString())

      jest.useRealTimers()
    })
  })

  describe('formatLastBackupDate', () => {
    test('returns "Aldrig" when lastBackupDate is null', () => {
      const result = formatLastBackupDate(null)
      expect(result).toBe('Aldrig')
    })

    test('returns "Aldrig" when lastBackupDate is undefined', () => {
      const result = formatLastBackupDate(undefined)
      expect(result).toBe('Aldrig')
    })

    test('formats date in Swedish locale by default', () => {
      const date = '2026-01-07T12:30:00Z'
      const result = formatLastBackupDate(date)
      // Swedish locale format includes date and time
      expect(result).toMatch(/\d{1,2}/)
      expect(result).toMatch(/jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec/i)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    test('accepts custom locale parameter', () => {
      const date = '2026-01-07T12:30:00Z'
      const result = formatLastBackupDate(date, 'en-US')
      // English locale format
      expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    })
  })
})
