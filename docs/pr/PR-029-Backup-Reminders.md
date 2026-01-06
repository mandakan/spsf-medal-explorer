# PR-029: Backup Reminders & Safety Nets

## Overview

**Phase**: 3 of 6 (Backup Improvements Roadmap)
**Priority**: MEDIUM ⚡
**Effort**: 3-4 days
**Impact**: Reduces risk of data loss through proactive reminders

Adds intelligent backup reminders based on user activity and preferences, with gentle nudges to back up data regularly.

## Problem Statement

```
Current State:
├─ No reminder to back up
├─ Users forget to export data
├─ Data loss when browser cleared
├─ No tracking of last backup
└─ Reactive (data already lost)

Result: Users lose months of progress
```

## Solution: Gentle, Preference-Based Reminders

```
After PR-029:
├─ Track last backup date
├─ Track last data change
├─ Gentle reminder after N days without backup
├─ User configurable: Never / 30d / 90d
├─ Dismissible banner (non-intrusive)
├─ Educational "How to stay safe" section
└─ Proactive (prevents data loss)

Result: 50%+ users back up within reminder window
```

## DESCRIPTION

### What This PR Does

1. **Backup Tracking**
   - Store "last backup date" in metadata
   - Store "last data change date" per profile
   - Calculate days since last backup

2. **Reminder Logic**
   - Show banner if: data changed AND backup > N days ago
   - User preference: Never, 30 days, 90 days (default)
   - Dismissible with "Remind me later"

3. **Backup Reminder Component**
   - Non-intrusive banner at top
   - Clear CTA: "Back up now"
   - Snooze for 7 days option
   - Educational tip included

4. **Backup Preferences**
   - Settings page section
   - Radio buttons for frequency
   - "How to keep your data safe" help

5. **Context Integration**
   - BackupContext manages state
   - Tracks backup/change dates
   - Exposes reminder logic

## Current Implementation Reference

**Files to integrate with**:
- `/src/contexts/ProfileContext.jsx` - Add lastDataChange tracking
- `/src/data/localStorage.js` or `indexedDBManager.js` - Store metadata
- `/src/pages/Settings.jsx` - Add backup preferences
- `/src/components/BackupButton.jsx` - Update lastBackupDate on export

## Files to Create/Modify

### NEW Files

```
src/contexts/BackupContext.jsx
├─ Track lastBackupDate, lastDataChange
├─ Calculate shouldRemind()
├─ Manage reminder preferences
└─ Expose backup state

src/components/BackupReminder.jsx
├─ Banner component
├─ Dismissible with snooze
├─ CTA button
└─ Educational tip

src/components/BackupPreferences.jsx
├─ Radio button group
├─ Frequency options
├─ Help section
└─ Save preference

src/utils/backupScheduler.js
├─ calculateReminderDue()
├─ shouldShowReminder()
└─ Reminder logic helpers
```

### MODIFIED Files

```
src/App.jsx
└─ Wrap with BackupProvider, show BackupReminder

src/contexts/ProfileContext.jsx
├─ Update lastDataChange on mutations
└─ Track profile changes

src/components/BackupButton.jsx
└─ Update lastBackupDate after export

src/pages/Settings.jsx
└─ Add BackupPreferences component
```

## CODE STRUCTURE

### BackupContext.jsx (NEW)

```jsx
// src/contexts/BackupContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useStorage } from '../hooks/useStorage'

const BackupContext = createContext()

export function BackupProvider({ children }) {
  const { manager } = useStorage()
  const [lastBackupDate, setLastBackupDate] = useState(null)
  const [lastDataChange, setLastDataChange] = useState(null)
  const [reminderFrequency, setReminderFrequency] = useState(30) // days
  const [reminderDismissedUntil, setReminderDismissedUntil] = useState(null)

  // Load metadata on mount
  useEffect(() => {
    async function loadMetadata() {
      if (!manager) return

      const lastBackup = await manager.getMetadata('lastBackupDate')
      const lastChange = await manager.getMetadata('lastDataChange')
      const frequency = await manager.getMetadata('backupReminderFrequency')
      const dismissed = await manager.getMetadata('reminderDismissedUntil')

      setLastBackupDate(lastBackup)
      setLastDataChange(lastChange)
      setReminderFrequency(frequency || 30)
      setReminderDismissedUntil(dismissed)
    }

    loadMetadata()
  }, [manager])

  // Mark backup created
  const markBackupCreated = useCallback(async () => {
    const now = new Date().toISOString()
    setLastBackupDate(now)

    if (manager) {
      await manager.setMetadata('lastBackupDate', now)
    }
  }, [manager])

  // Mark data changed
  const markDataChanged = useCallback(async () => {
    const now = new Date().toISOString()
    setLastDataChange(now)

    if (manager) {
      await manager.setMetadata('lastDataChange', now)
    }
  }, [manager])

  // Update reminder frequency
  const updateReminderFrequency = useCallback(async (days) => {
    setReminderFrequency(days)

    if (manager) {
      await manager.setMetadata('backupReminderFrequency', days)
    }
  }, [manager])

  // Dismiss reminder for 7 days
  const dismissReminder = useCallback(async () => {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const dismissUntil = sevenDaysFromNow.toISOString()

    setReminderDismissedUntil(dismissUntil)

    if (manager) {
      await manager.setMetadata('reminderDismissedUntil', dismissUntil)
    }
  }, [manager])

  // Calculate if reminder should show
  const shouldShowReminder = useCallback(() => {
    // Never remind if frequency is 0
    if (reminderFrequency === 0) return false

    // Don't show if dismissed recently
    if (reminderDismissedUntil) {
      const dismissedDate = new Date(reminderDismissedUntil)
      if (dismissedDate > new Date()) return false
    }

    // No data changes, no need to remind
    if (!lastDataChange) return false

    // Never backed up, and data exists
    if (!lastBackupDate) return true

    // Calculate days since last backup
    const lastBackup = new Date(lastBackupDate)
    const lastChange = new Date(lastDataChange)
    const now = new Date()

    const daysSinceBackup = Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24))
    const dataChangedAfterBackup = lastChange > lastBackup

    return dataChangedAfterBackup && daysSinceBackup >= reminderFrequency
  }, [lastBackupDate, lastDataChange, reminderFrequency, reminderDismissedUntil])

  const value = {
    lastBackupDate,
    lastDataChange,
    reminderFrequency,
    shouldShowReminder: shouldShowReminder(),
    markBackupCreated,
    markDataChanged,
    updateReminderFrequency,
    dismissReminder
  }

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>
}

export function useBackup() {
  const context = useContext(BackupContext)
  if (!context) {
    throw new Error('useBackup must be used within BackupProvider')
  }
  return context
}
```

### BackupReminder.jsx (NEW)

```jsx
// src/components/BackupReminder.jsx

import { useBackup } from '../contexts/BackupContext'
import { exportProfileBackupToJson } from '../logic/exporter'
import { useProfile } from '../contexts/ProfileContext'

/**
 * Gentle reminder banner for backups
 * Non-intrusive, dismissible, educational
 * WCAG 2.1 AA compliant
 */
export default function BackupReminder() {
  const { shouldShowReminder, dismissReminder, markBackupCreated } = useBackup()
  const { currentProfile } = useProfile()

  if (!shouldShowReminder || !currentProfile) return null

  const handleBackup = async () => {
    const date = new Date().toISOString().split('T')[0]
    await exportProfileBackupToJson(currentProfile, `medal-backup-${date}.json`)
    await markBackupCreated()
  }

  const handleDismiss = async () => {
    await dismissReminder()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        sticky top-0 z-30
        bg-gradient-to-r from-yellow-50 to-orange-50
        dark:from-yellow-950 dark:to-orange-950
        border-b-2 border-yellow-400 dark:border-yellow-600
        px-4 py-3
      "
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Icon + Message */}
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <div>
            <p className="font-semibold text-color-text-primary">
              Time to back up your data
            </p>
            <p className="text-sm text-color-text-secondary">
              Your data lives only on this device. Back up regularly to stay safe.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleBackup}
            className="
              px-4 py-2 rounded-lg font-medium
              bg-color-primary text-white
              hover:bg-color-primary-hover
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-primary
            "
          >
            Back up now
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Remind me in 7 days"
            className="
              px-4 py-2 rounded-lg font-medium
              bg-white dark:bg-gray-800
              text-color-text-primary
              border-2 border-color-border
              hover:bg-color-bg-secondary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-border
            "
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
```

### BackupPreferences.jsx (NEW)

```jsx
// src/components/BackupPreferences.jsx

import { useBackup } from '../contexts/BackupContext'

const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Never remind me', description: 'I'll back up manually' },
  { value: 30, label: 'Every 30 days', description: 'Recommended for most users' },
  { value: 90, label: 'Every 90 days', description: 'For advanced users' }
]

export default function BackupPreferences() {
  const { reminderFrequency, updateReminderFrequency, lastBackupDate } = useBackup()

  const handleChange = (value) => {
    updateReminderFrequency(value)
  }

  const lastBackupText = lastBackupDate
    ? new Date(lastBackupDate).toLocaleString()
    : 'Never'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-color-text-primary mb-2">
          Backup Reminders
        </h3>
        <p className="text-sm text-color-text-secondary mb-4">
          Get reminders to back up your data regularly
        </p>
      </div>

      {/* Frequency Options */}
      <fieldset className="space-y-3">
        <legend className="sr-only">Backup reminder frequency</legend>

        {FREQUENCY_OPTIONS.map((option) => (
          <div
            key={option.value}
            className="
              p-4 rounded-lg border-2
              transition-colors
              ${reminderFrequency === option.value
                ? 'border-color-primary bg-blue-50 dark:bg-blue-950'
                : 'border-color-border bg-color-bg-secondary'
              }
            "
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="backup-frequency"
                value={option.value}
                checked={reminderFrequency === option.value}
                onChange={() => handleChange(option.value)}
                className="
                  mt-1 w-5 h-5
                  text-color-primary
                  focus-visible:ring-2 focus-visible:ring-offset-2
                  focus-visible:ring-color-primary
                "
              />

              <div>
                <p className="font-medium text-color-text-primary">
                  {option.label}
                </p>
                <p className="text-sm text-color-text-secondary mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          </div>
        ))}
      </fieldset>

      {/* Last Backup Info */}
      <div
        className="
          p-4 rounded-lg
          bg-color-bg-secondary
          border border-color-border
        "
      >
        <p className="text-sm text-color-text-secondary">
          Last backup:{' '}
          <span className="font-medium text-color-text-primary">
            {lastBackupText}
          </span>
        </p>
      </div>

      {/* Educational Section */}
      <div
        className="
          p-4 rounded-lg
          bg-blue-50 dark:bg-blue-950
          border border-blue-200 dark:border-blue-800
        "
      >
        <h4 className="font-semibold text-color-text-primary mb-2">
          💡 How to keep your data safe
        </h4>
        <ul className="text-sm text-color-text-secondary space-y-1">
          <li>• Your data lives only on this device</li>
          <li>• Export regularly to avoid losing progress</li>
          <li>• Store backups in iCloud Drive, Google Drive, or USB</li>
          <li>• Multiple backups = extra safety</li>
        </ul>
      </div>
    </div>
  )
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] BackupContext tracks last backup date
- [ ] BackupContext tracks last data change
- [ ] Reminder logic works correctly
- [ ] Reminder shows after N days without backup
- [ ] Reminder shows only if data changed
- [ ] "Never" option disables reminders
- [ ] "Later" button dismisses for 7 days
- [ ] "Back up now" triggers export
- [ ] Preferences save correctly

### UX Requirements
- [ ] Banner non-intrusive (top of page)
- [ ] Banner dismissible
- [ ] Educational tips included
- [ ] Clear call-to-action
- [ ] No annoyance (gentle reminder)
- [ ] Works on mobile

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] role="status" on reminder
- [ ] aria-live="polite" for announcements
- [ ] Focus-visible on all buttons
- [ ] Keyboard navigation works
- [ ] Color contrast ≥4.5:1
- [ ] Radio buttons properly labeled

### Testing Requirements
- [ ] Unit tests for BackupContext
- [ ] Unit tests for reminder logic
- [ ] Unit tests for BackupReminder
- [ ] Unit tests for BackupPreferences
- [ ] Integration test: data change → reminder
- [ ] Integration test: backup → reminder cleared
- [ ] jest-axe: 0 violations

## DONE WHEN

- [ ] BackupContext created and tested
- [ ] BackupReminder component created
- [ ] BackupPreferences component created
- [ ] Settings page updated
- [ ] ProfileContext tracks data changes
- [ ] BackupButton updates lastBackupDate
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] 0 jest-axe violations
- [ ] Code review passed
- [ ] Merged to main

## Success Metrics

```
Before PR-029:
├─ Backup reminders: None
├─ Users forget to back up
└─ Data loss common

After PR-029:
├─ Backup reminders: Intelligent
├─ 50%+ users back up within reminder window
└─ Data loss reduced 70% ✨
```

---

**Priority**: MEDIUM ⚡
**Dependencies**: PR-027 (Backup UX), PR-028 (IndexedDB for metadata)
**Start Date**: Week 3 Monday
**Target Completion**: Week 3 Thursday (3-4 days)
**Next PR**: [PR-030: Cross-Device Workflows](./PR-030-Cross-Device-Workflows.md)
