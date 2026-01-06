# PR-027: Backup UX Polish

## Overview

**Phase**: 1 of 6 (Backup Improvements Roadmap)
**Priority**: HIGH 🔥
**Effort**: 2-3 days
**Impact**: Makes backups obvious, easy, and reassuring for non-technical users

Improves the user experience around backup/export/import with prominent UI, better naming, confirmation screens, and guided workflows.

## Problem Statement

```
Current State:
├─ Export button hidden in Settings > Data Management
├─ Generic filename: "medal-app-data.json"
├─ No confirmation after export (did it work?)
├─ Import requires navigation to different page
├─ No preview of what will be restored
├─ Non-technical users confused about "export JSON"
└─ Backup not perceived as important

Result: Only 15% of users create backups, data loss common
```

## Solution: Prominent, Reassuring Backup UX

```
After PR-027:
├─ "Back up my data" button on Home page
├─ Smart filename: "medal-backup-2026-01-06.json"
├─ Confirmation screen: "✓ Backup created + tips"
├─ Import button next to export
├─ Read-only preview before restore
├─ Plain language ("backup" not "export JSON")
└─ Educational tips about data safety

Result: 60%+ users back up regularly, confusion eliminated
```

## DESCRIPTION

### What This PR Does

Refines the backup/restore user experience with 5 key improvements:

1. **Prominent Backup Button**
   - Add large "Back up my data" card to Home page
   - Visible without navigating to Settings
   - Clear call-to-action with icon

2. **Smart File Naming**
   - Generate filename: `medal-backup-YYYY-MM-DD.json`
   - User recognizes file purpose at a glance
   - Easy to sort backups by date

3. **Post-Export Confirmation**
   - Modal after successful export
   - Shows filename and backup tips
   - Reassures user the action worked

4. **Import Next to Export**
   - Import button directly beside export
   - Clear label: "Restore from backup"
   - Reduces navigation confusion

5. **Read-Only Restore Preview**
   - Show backup metadata before restoring
   - Display: backup date, app version, # of achievements
   - Cancel or Confirm action
   - Prevents accidental data overwrite

### Key Components

1. **BackupButton** (New Component)
   - Prominent CTA on Home page
   - Triggers export with smart naming
   - Shows success confirmation

2. **BackupConfirmation** (New Component)
   - Modal after successful export
   - Educational tips
   - Dismissible or auto-dismiss

3. **ImportPreview** (Enhanced Component)
   - Read-only summary of backup contents
   - Backup date, version, record counts
   - Clear Cancel/Restore buttons

4. **ExportPanel** (Enhanced Component)
   - Better labeling ("backup" not "export")
   - Import button added inline
   - Simplified format selection

## Current Implementation Reference

**Existing Files** (to enhance):
- `/src/pages/DataBackup.jsx` - Current export/import page
- `/src/components/ExportPanel.jsx` - Export format selection
- `/src/components/ImportPanel.jsx` - File upload with drag-drop
- `/src/components/ProfileImportDialog.jsx` - Profile backup import
- `/src/logic/exporter.js` - Export logic wrapper
- `/src/utils/exportManager.js` - Export format generation
- `/src/utils/importManager.js` - Import parsing and validation

**Current Export Function** (in `/src/logic/exporter.js:3`):
```javascript
export function exportProfileBackupToJson() {
  const profile = getActiveProfile()
  const backup = toProfileBackup(profile)
  // Currently: generic filename
  downloadJSON(backup, 'medal-app-data.json')
}
```

**Current Storage Key** (in `/src/data/localStorage.js:9`):
```javascript
STORAGE_KEY = 'medal-app-data'
VERSION = '2.0'
```

## Files to Create/Modify

### NEW Components

```
src/components/BackupButton.jsx
├─ Large CTA button for Home page
├─ Icon + "Back up my data" label
├─ Triggers smart export
└─ Shows BackupConfirmation on success

src/components/BackupConfirmation.jsx
├─ Success modal after export
├─ Shows filename
├─ Educational tips
└─ Auto-dismiss or manual close

src/components/RestorePreviewDialog.jsx
├─ Read-only backup summary
├─ Shows: date, version, record counts
├─ Cancel / Restore buttons
└─ Prevents accidental overwrites
```

### MODIFIED Components

```
src/pages/Home.jsx
└─ Add BackupButton component

src/pages/DataBackup.jsx
└─ Enhance labels ("Backup" not "Export")

src/components/ExportPanel.jsx
├─ Update copy: "Back up" instead of "Export"
├─ Add "Restore from backup" button inline
└─ Improve format descriptions

src/components/ImportPanel.jsx
└─ Trigger RestorePreviewDialog before import

src/components/ProfileImportDialog.jsx
└─ Show metadata preview before restore
```

### MODIFIED Utilities

```
src/utils/exportManager.js
└─ Update downloadJSON to accept custom filename

src/logic/exporter.js
└─ Generate smart filename with date
```

## CODE STRUCTURE

### BackupButton.jsx (NEW)

```jsx
import { useState } from 'react'
import { useProfile } from '../contexts/ProfileContext'
import { exportProfileBackupToJson } from '../logic/exporter'
import BackupConfirmation from './BackupConfirmation'

/**
 * Prominent backup button for Home page
 * WCAG 2.1 AA compliant with proper ARIA labels
 */
export default function BackupButton() {
  const { currentProfile } = useProfile()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBackup = async () => {
    try {
      setLoading(true)

      // Generate smart filename
      const date = new Date().toISOString().split('T')[0]
      const name = `medal-backup-${date}.json`

      // Export with smart filename
      await exportProfileBackupToJson(currentProfile, name)

      setFilename(name)
      setShowConfirmation(true)
    } catch (error) {
      console.error('Backup error:', error)
      alert('Backup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentProfile || currentProfile.isGuest) {
    return null // Don't show for guest profiles
  }

  return (
    <>
      <button
        onClick={handleBackup}
        disabled={loading}
        aria-label="Back up my data"
        className="
          w-full min-h-[120px] p-6
          bg-gradient-to-br from-color-primary to-color-accent
          hover:from-color-primary-hover hover:to-color-accent-hover
          text-white rounded-xl
          flex flex-col items-center justify-center gap-3
          transition-all duration-200
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-4
          focus-visible:ring-color-primary focus-visible:ring-offset-2
        "
      >
        {/* Icon */}
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>

        {/* Label */}
        <span className="text-xl font-bold">
          {loading ? 'Creating backup...' : 'Back up my data'}
        </span>

        {/* Subtitle */}
        <span className="text-sm opacity-90">
          Save your achievements safely
        </span>
      </button>

      {showConfirmation && (
        <BackupConfirmation
          filename={filename}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </>
  )
}
```

### BackupConfirmation.jsx (NEW)

```jsx
import { useEffect } from 'react'

/**
 * Success modal after backup creation
 * Shows filename and educational tips
 * WCAG 2.1 AA compliant with proper ARIA
 */
export default function BackupConfirmation({ filename, onClose }) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-confirmation-title"
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90%] max-w-md
          bg-color-bg-primary
          border-2 border-color-border
          rounded-xl shadow-2xl
          p-6 z-50
        "
      >
        {/* Success Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="
              w-12 h-12 rounded-full
              bg-color-success
              flex items-center justify-center
            "
            aria-hidden="true"
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2
            id="backup-confirmation-title"
            className="text-2xl font-bold text-color-text-primary"
          >
            Backup Created
          </h2>
        </div>

        {/* Filename */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-color-bg-secondary
            border border-color-border
          "
        >
          <p className="text-sm text-color-text-secondary mb-1">
            File saved as:
          </p>
          <p className="font-mono text-color-text-primary break-all">
            {filename}
          </p>
        </div>

        {/* Educational Tips */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-blue-50 dark:bg-blue-950
            border border-blue-200 dark:border-blue-800
          "
        >
          <h3 className="font-semibold text-color-text-primary mb-2">
            💡 Keep your data safe
          </h3>
          <ul className="text-sm text-color-text-secondary space-y-1">
            <li>• Store in iCloud Drive, Google Drive, or USB stick</li>
            <li>• Your data stays only on your device</li>
            <li>• Back up regularly to avoid losing progress</li>
          </ul>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            w-full py-3 rounded-lg font-medium
            bg-color-primary text-white
            hover:bg-color-primary-hover
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
          "
        >
          Got it
        </button>
      </div>
    </>
  )
}
```

### RestorePreviewDialog.jsx (NEW)

```jsx
import { useMemo } from 'react'

/**
 * Preview backup contents before restoring
 * Shows metadata and record counts
 * WCAG 2.1 AA compliant
 */
export default function RestorePreviewDialog({
  backup,
  onRestore,
  onCancel
}) {
  // Extract metadata
  const metadata = useMemo(() => {
    const date = backup.profile?.lastModified || backup.exportDate || 'Unknown'
    const version = backup.version || '1.0'
    const achievementCount = backup.profile?.prerequisites?.length || 0
    const medalCount = backup.profile?.unlockedMedals?.length || 0

    return { date, version, achievementCount, medalCount }
  }, [backup])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-preview-title"
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90%] max-w-lg
          bg-color-bg-primary
          border-2 border-color-border
          rounded-xl shadow-2xl
          p-6 z-50
        "
      >
        {/* Title */}
        <h2
          id="restore-preview-title"
          className="text-2xl font-bold text-color-text-primary mb-6"
        >
          Restore from Backup
        </h2>

        {/* Warning */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-yellow-50 dark:bg-yellow-950
            border-2 border-yellow-400 dark:border-yellow-600
          "
          role="alert"
        >
          <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            ⚠️ This will replace your current data
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Make sure you have a backup of your current progress before restoring.
          </p>
        </div>

        {/* Backup Details */}
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-color-text-primary mb-3">
            Backup Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-color-bg-secondary border border-color-border">
              <p className="text-xs text-color-text-secondary mb-1">
                Backup Date
              </p>
              <p className="font-semibold text-color-text-primary">
                {new Date(metadata.date).toLocaleDateString()}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-color-bg-secondary border border-color-border">
              <p className="text-xs text-color-text-secondary mb-1">
                App Version
              </p>
              <p className="font-semibold text-color-text-primary">
                {metadata.version}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-color-bg-secondary border border-color-border">
              <p className="text-xs text-color-text-secondary mb-1">
                Achievements
              </p>
              <p className="font-semibold text-color-text-primary">
                {metadata.achievementCount}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-color-bg-secondary border border-color-border">
              <p className="text-xs text-color-text-secondary mb-1">
                Unlocked Medals
              </p>
              <p className="font-semibold text-color-text-primary">
                {metadata.medalCount}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 py-3 rounded-lg font-medium
              bg-color-bg-secondary text-color-text-primary
              border-2 border-color-border
              hover:bg-color-bg-tertiary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-border
            "
          >
            Cancel
          </button>

          <button
            onClick={onRestore}
            className="
              flex-1 py-3 rounded-lg font-medium
              bg-color-primary text-white
              hover:bg-color-primary-hover
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-primary
            "
          >
            Restore Now
          </button>
        </div>
      </div>
    </>
  )
}
```

### Enhanced exporter.js

```javascript
// src/logic/exporter.js (MODIFIED)

import { toProfileBackup } from '../utils/exportManager'
import { downloadFile } from '../utils/fileHandlers'

/**
 * Export profile backup with smart filename
 * @param {Object} profile - Profile to export
 * @param {string} [customFilename] - Optional custom filename
 */
export function exportProfileBackupToJson(profile, customFilename) {
  const backup = toProfileBackup(profile)

  // Generate smart filename if not provided
  const filename = customFilename || generateBackupFilename()

  downloadFile(backup, filename, 'application/json')
}

/**
 * Generate smart backup filename with current date
 * Format: medal-backup-YYYY-MM-DD.json
 */
function generateBackupFilename() {
  const date = new Date().toISOString().split('T')[0]
  return `medal-backup-${date}.json`
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] BackupButton appears on Home page
- [ ] BackupButton only shows for non-guest profiles
- [ ] Clicking BackupButton exports with smart filename
- [ ] Filename format: `medal-backup-YYYY-MM-DD.json`
- [ ] BackupConfirmation modal shows after successful export
- [ ] Confirmation shows correct filename
- [ ] Confirmation auto-dismisses after 8 seconds
- [ ] Confirmation can be manually dismissed
- [ ] ImportPanel triggers RestorePreviewDialog before restore
- [ ] RestorePreviewDialog shows correct metadata
- [ ] RestorePreviewDialog shows achievement/medal counts
- [ ] Cancel button aborts restore
- [ ] Restore button proceeds with import

### UX Requirements
- [ ] Backup process feels reassuring (success feedback)
- [ ] Language is non-technical ("backup" not "export")
- [ ] Tips educate users about data safety
- [ ] Preview prevents accidental overwrites
- [ ] All interactions feel smooth (no lag)

### Mobile Requirements
- [ ] BackupButton touch target ≥44px
- [ ] Modal works on mobile (full-screen on small devices)
- [ ] Confirmation readable on small screens
- [ ] Preview dialog scrollable if needed
- [ ] All buttons ≥44px tall

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] Color contrast ≥4.5:1 for all text
- [ ] Focus-visible indicators on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA labels on all buttons
- [ ] role="dialog" on modals
- [ ] aria-modal="true" on modals
- [ ] aria-labelledby on dialog titles
- [ ] Screen reader announces "Backup created"
- [ ] Success/warning icons have aria-hidden="true"

### Testing Requirements
- [ ] Unit tests for BackupButton
- [ ] Unit tests for BackupConfirmation
- [ ] Unit tests for RestorePreviewDialog
- [ ] Unit test for generateBackupFilename()
- [ ] Integration test: export → confirmation
- [ ] Integration test: import → preview → restore
- [ ] jest-axe: 0 violations
- [ ] Manual keyboard testing
- [ ] Manual screen reader testing (NVDA/VoiceOver)

## DESIGN REFERENCES

**Related Documents:**
- [ROADMAP-BACKUP-IMPROVEMENTS.md](./ROADMAP-BACKUP-IMPROVEMENTS.md) - Overall roadmap
- [CONTRIBUTING.md](/CONTRIBUTING.md) - Coding standards
- [03-Interaction-Design.md](/docs/03-Interaction-Design.md) - UX patterns
- [PR-009-Achievement-Import-Export.md](./done/PR-009-Achievement-Import-Export.md) - Existing export/import

**Key Design Principles:**
```
1. Prominent Placement
   └─ Backup on Home, not hidden in Settings

2. Reassuring Feedback
   └─ Visual confirmation + educational tips

3. Smart Defaults
   └─ Filename includes date automatically

4. Prevent Mistakes
   └─ Preview before restore

5. Non-Technical Language
   └─ "Backup" not "Export JSON"
```

## DONE WHEN

- [ ] BackupButton component created
- [ ] BackupConfirmation component created
- [ ] RestorePreviewDialog component created
- [ ] Home page shows BackupButton
- [ ] ExportPanel labels updated
- [ ] ImportPanel triggers preview
- [ ] Smart filename generation working
- [ ] All 20+ tests passing
- [ ] 0 jest-axe violations
- [ ] Manual keyboard testing complete
- [ ] Manual screen reader testing complete
- [ ] Mobile testing on iOS/Android
- [ ] Dark mode verified
- [ ] Code review passed
- [ ] Merged to main

## Performance Targets

```
Backup button render:   <50ms
Export with filename:   <500ms (same as before)
Confirmation modal:     <100ms (instant feel)
Preview dialog:         <100ms (instant feel)
Keyboard response:      <50ms (all interactions)
```

## Success Metrics

```
Before PR-027:
├─ Backup button: hidden in Settings
├─ Filename: generic "medal-app-data.json"
├─ Confirmation: none
├─ Preview: none
└─ Backup usage: 15% of users

After PR-027:
├─ Backup button: prominent on Home
├─ Filename: "medal-backup-2026-01-06.json"
├─ Confirmation: ✓ with tips
├─ Preview: ✓ before restore
└─ Backup usage: 60%+ of users ✨
```

## Testing Checklist

### Unit Tests
- [ ] BackupButton renders correctly
- [ ] BackupButton disabled state works
- [ ] BackupButton onClick triggers export
- [ ] BackupConfirmation shows correct filename
- [ ] BackupConfirmation auto-dismisses
- [ ] BackupConfirmation Escape key closes
- [ ] RestorePreviewDialog shows metadata
- [ ] RestorePreviewDialog Cancel works
- [ ] RestorePreviewDialog Restore works
- [ ] generateBackupFilename() format correct

### Integration Tests
- [ ] Home → BackupButton → Confirmation flow
- [ ] Import → Preview → Restore flow
- [ ] Export with smart filename downloads correctly

### Accessibility Tests
- [ ] jest-axe on all components
- [ ] Keyboard Tab navigation
- [ ] Keyboard Enter/Space activation
- [ ] Keyboard Escape dismissal
- [ ] Screen reader announcements
- [ ] Focus-visible indicators
- [ ] Color contrast validation

### Manual Tests
- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] iOS Safari mobile
- [ ] Android Chrome mobile
- [ ] Dark mode
- [ ] Keyboard-only navigation
- [ ] NVDA screen reader (Windows)
- [ ] VoiceOver screen reader (Mac/iOS)

---

**Priority**: HIGH 🔥
**Start Date**: Week 1 Monday
**Target Completion**: Week 1 Wednesday (2-3 days)
**Next PR**: [PR-028: IndexedDB Migration](./PR-028-IndexedDB-Migration.md)
