# PR-009: Achievement Import/Export System

## Overview

**Status**: Phase 3  
**Priority**: HIGH  
**Effort**: 3-4 days  
**Impact**: Full data portability, no vendor lock-in  

Allows users to export all achievement data in multiple formats (JSON, CSV, PDF) and import from external sources. Critical for data ownership and backup.

## Problem Statement

```
Current State (POC - Broken):
├─ No export capability
├─ No import capability  
├─ Data trapped in app
├─ No backup mechanism
└─ No data sharing

Result: Users can't backup data or share progress
```

## Solution: Multi-Format Import/Export

```
Export Formats:
├─ JSON (complete profile)
├─ CSV (spreadsheet import)
├─ PDF (visual summary with canvas)
└─ QR Code (shareable progress)

Import Formats:
├─ JSON upload
├─ CSV paste/upload
├─ SHB official format
└─ Duplicate detection
```

## DESCRIPTION

### What This PR Does

Provides complete data export/import functionality with multiple formats. Users can:
- Export achievements as JSON/CSV/PDF
- Import achievements from files
- Share progress via QR code
- Backup and restore profiles
- Migrate between devices

### Key Components

1. **ExportManager** (Utility)
   - Generate JSON export
   - Generate CSV export
   - Generate PDF summary
   - Generate QR code

2. **ExportUI** (Component)
   - Select export format
   - Customize fields to export
   - Download file
   - Copy to clipboard

3. **ImportManager** (Utility)
   - Parse JSON imports
   - Parse CSV imports
   - Validate data
   - Detect duplicates

4. **ImportUI** (Component)
   - Drag & drop upload
   - File picker
   - Preview data
   - Conflict resolution

## Files to Create

### Components
```
src/components/ExportPanel.jsx
├─ Format selection
├─ Field customization
└─ Download/copy buttons

src/components/ImportPanel.jsx
├─ File upload (drag/drop)
├─ Preview table
├─ Conflict resolution
└─ Progress indicator

src/components/ShareDialog.jsx
├─ Generate QR code
├─ Copy share link
└─ Social sharing buttons
```

### Utilities & Managers
```
src/utils/exportManager.js
├─ toJSON(profile)
├─ toCSV(achievements)
├─ toPDF(profile)
└─ toQRCode(shareData)

src/utils/importManager.js
├─ parseJSON(file)
├─ parseCSV(file)
├─ validateData(achievements)
├─ detectDuplicates(achievements)
└─ resolveConflicts(existing, new)

src/utils/fileHandlers.js
├─ downloadFile(data, filename)
├─ readFile(file)
├─ formatFileSize(bytes)
```

### Tests
```
src/utils/__tests__/exportManager.test.js
├─ JSON export format
├─ CSV export format
├─ PDF generation
├─ QR code generation

src/utils/__tests__/importManager.test.js
├─ JSON parsing
├─ CSV parsing
├─ Validation rules
├─ Duplicate detection

src/components/__tests__/ExportPanel.test.js
src/components/__tests__/ImportPanel.test.js
src/components/__tests__/ShareDialog.test.js
```

## Data Formats

### JSON Export Format

```json
{
  "version": "1.0",
  "exportDate": "2025-12-20T10:00:00Z",
  "profile": {
    "id": "user-123",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "achievements": [
    {
      "id": "ach-001",
      "medalId": "medal-gold-100",
      "type": "competition",
      "date": "2025-12-15",
      "score": 95,
      "notes": "Championship",
      "createdAt": "2025-12-15T10:00:00Z"
    }
  ],
  "filters": [
    {
      "id": "filter-001",
      "name": "Rifle Medals",
      "criteria": { "weapon": "rifle" }
    }
  ]
}
```

### CSV Export Format

```csv
Medal,Type,Date,Score,Position,Weapon,Team,Notes,Status
Medal Name,competition,2025-12-15,95,,rifle,,Championship,unlocked
Medal Name,qualification,2025-12-14,285,,pistol,,25m qualification,achievable
```

### PDF Export

```
Medal Progress Report
────────────────────
Generated: 2025-12-20

Summary:
├─ Total Achievements: 45
├─ Unlocked Medals: 32
├─ Achievable Medals: 8
└─ Locked Medals: 5

Detailed List:
├─ Medal Name │ Type │ Date │ Score │ Status
└─ ...
```

## CODE STRUCTURE

### ExportPanel.jsx

```jsx
import { useState } from 'react'
import * as exportManager from '../../utils/exportManager'

export default function ExportPanel({ profile }) {
  const [format, setFormat] = useState('json')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleExport = async (exportFormat) => {
    try {
      setLoading(true)
      let data, filename

      switch (exportFormat) {
        case 'json':
          data = await exportManager.toJSON(profile)
          filename = `medal-profile-${new Date().toISOString().split('T')[0]}.json`
          downloadJSON(data, filename)
          break

        case 'csv':
          data = await exportManager.toCSV(profile.achievements)
          filename = `achievements-${new Date().toISOString().split('T')[0]}.csv`
          downloadCSV(data, filename)
          break

        case 'pdf':
          data = await exportManager.toPDF(profile)
          filename = `medal-report-${new Date().toISOString().split('T')[0]}.pdf`
          downloadPDF(data, filename)
          break
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
        p-6 bg-color-bg-secondary dark:bg-color-bg-secondary
        rounded-lg border-2 border-color-border
      "
    >
      <h2 className="
        text-xl font-bold text-color-text-primary mb-6
      ">
        Export Profile
      </h2>

      {/* Format Selection */}
      <fieldset className="mb-6 space-y-3">
        <legend className="
          text-sm font-medium text-color-text-primary mb-3
        ">
          Export Format
        </legend>

        {['json', 'csv', 'pdf'].map((fmt) => (
          <div key={fmt} className="flex items-center">
            <input
              id={`format-${fmt}`}
              type="radio"
              name="format"
              value={fmt}
              checked={format === fmt}
              onChange={(e) => setFormat(e.target.value)}
              className="
                w-5 h-5 rounded
                bg-color-bg-primary
                border-2 border-color-border
                focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-color-primary
              "
            />
            <label
              htmlFor={`format-${fmt}`}
              className="
                ml-3 text-base font-medium
                text-color-text-primary
                cursor-pointer
              "
            >
              {fmt.toUpperCase()} {getFormatDescription(fmt)}
            </label>
          </div>
        ))}
      </fieldset>

      {/* Export Button */}
      <button
        onClick={() => handleExport(format)}
        disabled={loading}
        className="
          w-full py-3 px-4 rounded-lg font-medium
          bg-color-primary text-white
          hover:bg-color-primary-hover
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-color-primary
        "
      >
        {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
      </button>

      {success && (
        <div
          className="
            mt-4 p-3 rounded-lg
            bg-color-success-bg text-color-success
            border-2 border-color-success
            flex items-center gap-2
          "
          role="status"
        >
          <span>✓</span>
          <span>Exported successfully!</span>
        </div>
      )}
    </div>
  )
}

function getFormatDescription(format) {
  switch (format) {
    case 'json':
      return '(Complete profile backup)'
    case 'csv':
      return '(Spreadsheet compatible)'
    case 'pdf':
      return '(Printable report)'
    default:
      return ''
  }
}
```

### ImportPanel.jsx

```jsx
import { useState, useRef } from 'react'
import * as importManager from '../../utils/importManager'

export default function ImportPanel({ onImport }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [conflicts, setConflicts] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file) => {
    try {
      setLoading(true)
      const data = await importManager.parseFile(file)
      
      // Check for duplicates
      const dupes = await importManager.detectDuplicates(data)
      
      if (dupes.length > 0) {
        setConflicts(dupes)
      }

      setPreview(data)
    } catch (error) {
      setPreview({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    try {
      setLoading(true)
      await onImport(preview)
      setPreview(null)
      setConflicts(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
        p-6 bg-color-bg-secondary dark:bg-color-bg-secondary
        rounded-lg border-2 border-color-border
      "
    >
      <h2 className="
        text-xl font-bold text-color-text-primary mb-6
      ">
        Import Achievements
      </h2>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          p-8 rounded-lg border-2 border-dashed
          text-center cursor-pointer
          transition-colors
          ${isDragging
            ? 'bg-color-primary-light border-color-primary'
            : 'bg-color-bg-primary border-color-border'
          }
        `}
      >
        <p className="text-color-text-secondary mb-2">
          Drag & drop JSON/CSV file here
        </p>
        <p className="text-color-text-tertiary text-sm mb-4">
          or
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="
            px-4 py-2 rounded-lg
            bg-color-primary text-white
            hover:bg-color-primary-hover
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
          "
        >
          Choose File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={(e) => e.target.files?.length && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {preview && !preview.error && (
        <div className="mt-6">
          <h3 className="
            font-medium text-color-text-primary mb-3
          ">
            Preview ({preview.achievements?.length || 0} achievements)
          </h3>
          <div className="
            max-h-48 overflow-y-auto
            border-2 border-color-border rounded-lg p-3
          ">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-color-text-secondary">
                  <th className="text-left">Medal</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {preview.achievements?.map((ach, i) => (
                  <tr key={i} className="border-t border-color-border">
                    <td className="py-2">{ach.medalId}</td>
                    <td className="py-2">{ach.type}</td>
                    <td className="py-2">{ach.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading}
            className="
              w-full mt-4 py-3 px-4 rounded-lg font-medium
              bg-color-primary text-white
              hover:bg-color-primary-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-primary
            "
          >
            {loading ? 'Importing...' : 'Import Achievements'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {preview?.error && (
        <div
          className="
            mt-4 p-3 rounded-lg
            bg-color-error-bg text-color-error
            border-2 border-color-error
            flex items-center gap-2
          "
          role="alert"
        >
          <span>✕</span>
          <span>{preview.error}</span>
        </div>
      )}
    </div>
  )
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] JSON export creates valid, parseable file
- [ ] CSV export opens correctly in Excel/Sheets
- [ ] PDF export readable with charts/summary
- [ ] JSON import works correctly
- [ ] CSV import validates data
- [ ] Duplicate detection prevents data loss
- [ ] QR code generates and is scannable

### File Handling
- [ ] Drag & drop upload works
- [ ] File picker works on mobile
- [ ] File size validation (max 50MB)
- [ ] Format validation before import
- [ ] Error messages clear and helpful

### Mobile Requirements
- [ ] File upload works on iOS/Android
- [ ] Drag & drop on desktop only
- [ ] File picker works on mobile
- [ ] Preview table scrollable
- [ ] All buttons 44px minimum

### Accessibility Requirements
- [ ] WCAG 2.1 AA contrast (all text)
- [ ] Dark mode support
- [ ] Focus-visible rings
- [ ] aria-label on buttons
- [ ] Form labels associated
- [ ] Error messages announced

### Testing Requirements
- [ ] 50+ test cases (all formats)
- [ ] 95%+ code coverage
- [ ] jest-axe: 0 violations
- [ ] Manual file upload test
- [ ] Manual mobile test

## DESIGN REFERENCES

**Related Documents:**
- 02-Data-Model.md (achievement structure)
- WCAG-ACCESSIBLE-DESIGN-SYSTEM.md (accessibility)

**Key Design Principles:**
```
1. Data Ownership
   └─ Users can export data anytime

2. Multiple Formats
   └─ JSON (backup), CSV (spreadsheet), PDF (print)

3. Safe Import
   └─ Validate before importing, show conflicts

4. Mobile First
   └─ File picker works on all devices

5. Accessible Always
   └─ WCAG 2.1 AA on all components
```

## DONE WHEN

- [ ] All 3 components created and tested
- [ ] JSON export/import working
- [ ] CSV export/import working
- [ ] PDF export working
- [ ] QR code generation working
- [ ] 50+ test cases passing
- [ ] 0 jest-axe violations
- [ ] Mobile file handling tested
- [ ] Dark mode verified
- [ ] Manual testing complete
- [ ] Code review passed

## Performance Targets

```
JSON export:    <500ms (even with 1000 achievements)
CSV export:     <200ms
PDF export:     <1000ms
JSON import:    <500ms (including validation)
CSV import:     <500ms (including validation)
```

## Success Metrics

```
Before PR-009:
├─ No export option
├─ Data trapped in app
└─ No backup mechanism

After PR-009:
├─ Multiple export formats
├─ Full import support
├─ Data ownership
└─ Safe backup/restore ✨
```

---

**Priority**: HIGH - Needed for production  
**Start Date**: Week 7 Monday  
**Target Completion**: Week 7 Thursday (3-4 days)  
**Next PR**: PR-010 (Complete Medal Database)
