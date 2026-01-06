# PR-030: Cross-Device Workflows

## Overview

**Phase**: 4 of 6 (Backup Improvements Roadmap)
**Priority**: MEDIUM ⚡
**Effort**: 2-3 days
**Impact**: Easy cloud backup without vendor lock-in

Integrates Web Share API to allow users to save backups directly to their preferred cloud storage with one tap on mobile.

## Problem Statement

```
Current State:
├─ Export downloads file to Downloads folder
├─ User must manually move to cloud storage
├─ Multi-step process (confusing on mobile)
├─ No guidance on cloud storage
└─ Users don't know how to sync across devices

Result: Backups stay in Downloads, deleted accidentally
```

## Solution: One-Tap Cloud Sharing

```
After PR-030:
├─ Web Share API integration
├─ "Share to cloud" button
├─ Direct to Files, iCloud Drive, Google Drive
├─ Simple restore recipe in UI
├─ No server-side storage (user owns data)
└─ Works with existing export formats

Result: 80% mobile users save to cloud in 1 tap
```

## DESCRIPTION

### What This PR Does

1. **Web Share API Integration**
   - Detect navigator.share() support
   - Share backup file directly from export
   - Trigger native OS share sheet

2. **ShareBackupDialog Component**
   - Shows after export
   - "Share to cloud" button (if supported)
   - "Download" button (fallback)
   - Tips on where to save

3. **Restore Recipe**
   - In-app guide: "How to restore from cloud"
   - Step-by-step instructions
   - Works with iCloud, Google Drive, OneDrive

4. **Feature Detection**
   - Graceful degradation if unsupported
   - Desktop: show download only
   - Mobile: prefer share, fallback to download

## Current Implementation Reference

**Files to integrate with**:
- `/src/components/BackupButton.jsx` - After export, show share option
- `/src/logic/exporter.js` - Export logic
- `/src/utils/exportManager.js` - File generation

## Files to Create/Modify

### NEW Files

```
src/components/ShareBackupDialog.jsx
├─ Share button (if supported)
├─ Download button (fallback)
├─ Cloud storage tips
└─ WCAG 2.1 AA compliant

src/utils/shareManager.js
├─ isShareSupported()
├─ shareFile(file, filename)
└─ Feature detection

src/components/RestoreGuide.jsx
├─ Step-by-step restore instructions
├─ Cloud-specific tips
└─ Accessible help content
```

### MODIFIED Files

```
src/components/BackupButton.jsx
└─ Show ShareBackupDialog after export

src/components/BackupConfirmation.jsx
└─ Add share button option

src/pages/DataBackup.jsx
└─ Add RestoreGuide component
```

## CODE STRUCTURE

### shareManager.js (NEW)

```javascript
// src/utils/shareManager.js

/**
 * Check if Web Share API is supported
 */
export function isShareSupported() {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * Check if device can share files
 */
export function isFileShareSupported() {
  if (!isShareSupported()) return false

  try {
    // Check if we can share files
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    return navigator.canShare && navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

/**
 * Share backup file via native share sheet
 * @param {Blob} blob - File data
 * @param {string} filename - Filename
 * @param {string} title - Share title
 */
export async function shareFile(blob, filename, title = 'Medal Backup') {
  if (!isFileShareSupported()) {
    throw new Error('File sharing not supported on this device')
  }

  const file = new File([blob], filename, {
    type: blob.type || 'application/json'
  })

  try {
    await navigator.share({
      files: [file],
      title: title,
      text: 'Backup of my medal progress'
    })

    return { success: true }
  } catch (error) {
    // User cancelled or error occurred
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true }
    }

    throw error
  }
}

/**
 * Get appropriate message for device/browser
 */
export function getShareMessage() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  if (isIOS) {
    return 'Save to iCloud Drive, Files, or another app'
  }

  if (isAndroid) {
    return 'Save to Google Drive, Files, or another app'
  }

  return 'Save to cloud storage or another app'
}
```

### ShareBackupDialog.jsx (NEW)

```jsx
// src/components/ShareBackupDialog.jsx

import { useState } from 'react'
import { isFileShareSupported, shareFile, getShareMessage } from '../utils/shareManager'
import { useBackup } from '../contexts/BackupContext'

/**
 * Dialog offering to share backup to cloud storage
 * Uses Web Share API on mobile, download fallback on desktop
 * WCAG 2.1 AA compliant
 */
export default function ShareBackupDialog({ file, filename, onClose }) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const { markBackupCreated } = useBackup()

  const canShare = isFileShareSupported()
  const shareMessage = getShareMessage()

  const handleShare = async () => {
    try {
      setSharing(true)
      setError(null)

      const result = await shareFile(file, filename)

      if (result.success) {
        await markBackupCreated()
        // Don't close automatically, let user see confirmation
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = () => {
    // Trigger download via existing mechanism
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    markBackupCreated()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-backup-title"
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90%] max-w-md
          bg-color-bg-primary
          border-2 border-color-border
          rounded-xl shadow-2xl
          p-6 z-50
        "
      >
        {/* Icon & Title */}
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
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2
            id="share-backup-title"
            className="text-xl font-bold text-color-text-primary"
          >
            Backup Created
          </h2>
        </div>

        {/* Filename */}
        <div
          className="
            mb-4 p-3 rounded-lg
            bg-color-bg-secondary
            border border-color-border
          "
        >
          <p className="text-sm text-color-text-secondary mb-1">
            Backup file:
          </p>
          <p className="font-mono text-sm text-color-text-primary break-all">
            {filename}
          </p>
        </div>

        {/* Cloud Storage Tip */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-blue-50 dark:bg-blue-950
            border border-blue-200 dark:border-blue-800
          "
        >
          <p className="font-semibold text-color-text-primary mb-2">
            💾 {canShare ? shareMessage : 'Save your backup'}
          </p>
          <p className="text-sm text-color-text-secondary">
            {canShare
              ? 'Tap "Share" to save to your cloud storage'
              : 'Download and upload to your preferred cloud storage'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="
              mb-4 p-3 rounded-lg
              bg-color-error-bg text-color-error
              border border-color-error
            "
            role="alert"
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {canShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="
                w-full py-3 rounded-lg font-medium
                bg-color-primary text-white
                hover:bg-color-primary-hover
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-offset-2 focus-visible:ring-color-primary
                flex items-center justify-center gap-2
              "
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {sharing ? 'Sharing...' : 'Share to Cloud'}
            </button>
          )}

          <button
            onClick={handleDownload}
            className="
              w-full py-3 rounded-lg font-medium
              bg-color-bg-secondary text-color-text-primary
              border-2 border-color-border
              hover:bg-color-bg-tertiary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-border
              flex items-center justify-center gap-2
            "
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download to Device
          </button>

          <button
            onClick={onClose}
            className="
              w-full py-2 text-color-text-secondary
              hover:text-color-text-primary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-border
            "
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
```

### RestoreGuide.jsx (NEW)

```jsx
// src/components/RestoreGuide.jsx

/**
 * Step-by-step guide for restoring from cloud backup
 * Accessible help content
 */
export default function RestoreGuide() {
  return (
    <div
      className="
        p-6 rounded-lg
        bg-color-bg-secondary
        border-2 border-color-border
      "
    >
      <h3 className="text-xl font-bold text-color-text-primary mb-4">
        📖 How to Restore from Cloud Backup
      </h3>

      <ol className="space-y-4 text-color-text-secondary">
        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-color-primary text-white
              flex items-center justify-center
              font-bold text-sm
            "
          >
            1
          </span>
          <div>
            <p className="font-semibold text-color-text-primary mb-1">
              Download your backup
            </p>
            <p className="text-sm">
              Find your backup file in iCloud Drive, Google Drive, or wherever you saved it.
              Download it to this device.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-color-primary text-white
              flex items-center justify-center
              font-bold text-sm
            "
          >
            2
          </span>
          <div>
            <p className="font-semibold text-color-text-primary mb-1">
              Open this app
            </p>
            <p className="text-sm">
              Navigate to Settings → Data Management (or use the import button below).
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-color-primary text-white
              flex items-center justify-center
              font-bold text-sm
            "
          >
            3
          </span>
          <div>
            <p className="font-semibold text-color-text-primary mb-1">
              Choose your backup file
            </p>
            <p className="text-sm">
              Click "Restore from backup" and select the downloaded file
              (e.g., <code className="text-xs bg-color-bg-tertiary px-1 py-0.5 rounded">medal-backup-2026-01-06.json</code>).
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span
            className="
              flex-shrink-0 w-8 h-8 rounded-full
              bg-color-primary text-white
              flex items-center justify-center
              font-bold text-sm
            "
          >
            4
          </span>
          <div>
            <p className="font-semibold text-color-text-primary mb-1">
              Confirm restore
            </p>
            <p className="text-sm">
              Review the preview (date, number of achievements) and click "Restore now".
              Your data will be restored immediately.
            </p>
          </div>
        </li>
      </ol>

      <div
        className="
          mt-6 p-4 rounded-lg
          bg-blue-50 dark:bg-blue-950
          border border-blue-200 dark:border-blue-800
        "
      >
        <p className="text-sm font-semibold text-color-text-primary mb-2">
          💡 Pro tip
        </p>
        <p className="text-sm text-color-text-secondary">
          Keep multiple backups in different locations (cloud + USB stick) for extra safety.
        </p>
      </div>
    </div>
  )
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] Web Share API detection works
- [ ] Share button shows on supported devices
- [ ] Share triggers native OS share sheet
- [ ] Download fallback works on desktop
- [ ] File shares correctly (JSON format)
- [ ] RestoreGuide displays correctly

### Mobile Requirements
- [ ] Share works on iOS Safari
- [ ] Share works on Android Chrome
- [ ] Native share sheet appears
- [ ] Can save to iCloud Drive
- [ ] Can save to Google Drive
- [ ] Touch targets ≥44px

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] Focus-visible on all buttons
- [ ] Keyboard navigation works
- [ ] Color contrast ≥4.5:1
- [ ] role="dialog" on modal
- [ ] aria-labelledby on dialog
- [ ] Error messages announced

### Testing Requirements
- [ ] Unit tests for shareManager
- [ ] Unit tests for ShareBackupDialog
- [ ] Unit test for feature detection
- [ ] Manual iOS testing
- [ ] Manual Android testing
- [ ] jest-axe: 0 violations

## DONE WHEN

- [ ] shareManager utility created
- [ ] ShareBackupDialog component created
- [ ] RestoreGuide component created
- [ ] BackupButton triggers share option
- [ ] DataBackup page shows RestoreGuide
- [ ] All tests passing
- [ ] iOS Safari tested
- [ ] Android Chrome tested
- [ ] Desktop fallback tested
- [ ] Code review passed
- [ ] Merged to main

## Success Metrics

```
Before PR-030:
├─ Mobile backup: Complex multi-step process
├─ Cloud storage: Manual upload required
└─ Restore: Confusing for users

After PR-030:
├─ Mobile backup: 1-tap to cloud
├─ Cloud storage: Native OS integration
└─ Restore: Clear step-by-step guide ✨
```

---

**Priority**: MEDIUM ⚡
**Dependencies**: PR-027 (Backup UX)
**Start Date**: Week 3 Friday (or Week 4 Monday)
**Target Completion**: 2-3 days
**Next PR**: [PR-031: Encrypted Backups](./PR-031-Encrypted-Backups.md) or [PR-032: Data Integrity](./PR-032-Data-Integrity.md)
