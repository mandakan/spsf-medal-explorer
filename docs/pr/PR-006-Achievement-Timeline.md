# PR-006: Advanced Achievement Input & Timeline (React + Tailwind + Vite)

## DESCRIPTION
Enhance achievement input with batch operations, achievement history/timeline view, and undo/redo functionality. Users can log multiple achievements at once, view their progression over time, and easily correct mistakes without data loss.

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System
- PR-003: Medal Achievement Calculator
- PR-004: UI Shell with React Router

## ACCEPTANCE CRITERIA
- [ ] Batch achievement input form (add multiple achievements at once)
- [ ] Achievement history/timeline view with chronological display
- [ ] Undo/redo functionality with full state management
- [ ] Edit existing achievements inline
- [ ] Delete achievements with confirmation
- [ ] Achievement validation before submission
- [ ] Statistics dashboard (medals/year, progression rate, etc.)
- [ ] Filter achievements by year, type, weapon group
- [ ] Export achievement history as CSV
- [ ] Achievement duplication detection
- [ ] Keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo)
- [ ] Achievement count badge in navigation

## FILES TO CREATE
- src/components/BatchAchievementForm.jsx (multi-achievement input)
- src/components/AchievementTimeline.jsx (chronological view)
- src/components/AchievementCard.jsx (individual achievement display)
- src/components/StatisticsDashboard.jsx (progression analytics)
- src/hooks/useUndoRedo.js (undo/redo state management)
- src/hooks/useAchievementHistory.js (history operations)
- src/logic/achievementValidator.js (validation rules)
- src/logic/achievementAnalytics.js (statistics calculations)
- src/utils/achievementExport.js (CSV export)
- src/contexts/UndoRedoContext.jsx (undo/redo context)
- tests/achievementValidator.test.js
- tests/achievementAnalytics.test.js

## CODE STRUCTURE

### src/contexts/UndoRedoContext.jsx

```jsx
import React, { createContext, useState, useCallback } from 'react'

export const UndoRedoContext = createContext(null)

export function UndoRedoProvider({ children }) {
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const pushState = useCallback((newState) => {
    // Remove any redo history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      return history[historyIndex - 1]
    }
    return null
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      return history[historyIndex + 1]
    }
    return null
  }, [history, historyIndex])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <UndoRedoContext.Provider value={{ pushState, undo, redo, canUndo, canRedo }}>
      {children}
    </UndoRedoContext.Provider>
  )
}
```

### src/hooks/useUndoRedo.js

```javascript
import { useContext } from 'react'
import { UndoRedoContext } from '../contexts/UndoRedoContext'

export function useUndoRedo() {
  const context = useContext(UndoRedoContext)
  
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider')
  }
  
  return context
}
```

### src/components/BatchAchievementForm.jsx

```jsx
import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { InputValidator } from '../logic/validator'
import { validateAchievements } from '../logic/achievementValidator'
import { Achievement } from '../models/Achievement'

export default function BatchAchievementForm() {
  const { addAchievement, currentProfile } = useProfile()
  const [rows, setRows] = useState([
    { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
  ])
  const [errors, setErrors] = useState({})
  const [successCount, setSuccessCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const handleAddRow = () => {
    setRows([
      ...rows,
      { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
    ])
  }

  const handleRemoveRow = (index) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentProfile) {
      setErrors({ form: 'No profile selected' })
      return
    }

    // Validate all rows
    const validation = validateAchievements(rows)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      setSubmitting(true)
      let added = 0

      for (const row of rows) {
        if (row.points) {
          const achievement = new Achievement({
            type: row.type,
            year: parseInt(row.year),
            weaponGroup: row.weaponGroup,
            points: parseInt(row.points),
            date: new Date().toISOString().split('T')[0]
          })

          await addAchievement(achievement)
          added++
        }
      }

      setSuccessCount(added)
      setRows([
        { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
      ])
      setErrors({})

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessCount(0), 3000)
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Batch Add Achievements</h2>

      {successCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="text-green-700">✓ Successfully added {successCount} achievement(s)</p>
        </div>
      )}

      {errors.form && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{errors.form}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left px-3 py-2">Year</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-left px-3 py-2">Points</th>
                <th className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={row.year}
                      onChange={(e) => handleRowChange(index, 'year', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.type}
                      onChange={(e) => handleRowChange(index, 'type', e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
                    >
                      <option value="gold_series">Gold Series</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.weaponGroup}
                      onChange={(e) => handleRowChange(index, 'weaponGroup', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={row.points}
                      onChange={(e) => handleRowChange(index, 'points', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="0-50"
                      disabled={submitting}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={submitting}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={submitting}
          >
            + Add Row
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
            disabled={submitting || rows.every(r => !r.points)}
          >
            {submitting ? 'Adding...' : 'Add All Achievements'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

### src/components/AchievementTimeline.jsx

```jsx
import React, { useMemo, useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import AchievementCard from './AchievementCard'

export default function AchievementTimeline() {
  const { currentProfile } = useProfile()
  const [filterYear, setFilterYear] = useState(null)
  const [filterType, setFilterType] = useState(null)

  const sortedAchievements = useMemo(() => {
    if (!currentProfile?.prerequisites) return []

    let achievements = [...currentProfile.prerequisites]

    if (filterYear) {
      achievements = achievements.filter(a => a.year === filterYear)
    }
    if (filterType) {
      achievements = achievements.filter(a => a.type === filterType)
    }

    return achievements.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [currentProfile, filterYear, filterType])

  const years = useMemo(() => {
    if (!currentProfile?.prerequisites) return []
    return [...new Set(currentProfile.prerequisites.map(a => a.year))].sort((a, b) => b - a)
  }, [currentProfile])

  if (!currentProfile) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700">Please select a profile to view achievements</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-bold mb-4 text-text-primary">Filters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              value={filterYear || ''}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">All Types</option>
              <option value="gold_series">Gold Series</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary">
          {sortedAchievements.length} Achievement(s)
        </h3>

        {sortedAchievements.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-text-secondary">No achievements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### src/components/AchievementCard.jsx

```jsx
import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

export default function AchievementCard({ achievement }) {
  const { currentProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(achievement)

  const handleDelete = async () => {
    if (!confirm('Delete this achievement?')) return
    
    try {
      // Implement delete functionality
      // await deleteAchievement(achievement.id)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleSave = async () => {
    try {
      // Implement update functionality
      // await updateAchievement(editedData)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const typeLabel = {
    'gold_series': 'Gold Series',
    'competition_result': 'Competition Result',
    'special_achievement': 'Special Achievement'
  }[achievement.type] || achievement.type

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              value={editedData.year}
              onChange={(e) => setEditedData({ ...editedData, year: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Points</label>
            <input
              type="number"
              value={editedData.points}
              onChange={(e) => setEditedData({ ...editedData, points: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start">
      <div>
        <div className="flex gap-2 items-center mb-1">
          <span className="font-semibold text-text-primary">{typeLabel}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-text-secondary">
            Group {achievement.weaponGroup}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {achievement.date} • {achievement.points} points
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
```

### src/components/StatisticsDashboard.jsx

```jsx
import React, { useMemo } from 'react'
import { useProfile } from '../hooks/useProfile'
import { calculateAchievementStats } from '../logic/achievementAnalytics'

export default function StatisticsDashboard() {
  const { currentProfile } = useProfile()

  const stats = useMemo(() => {
    if (!currentProfile?.prerequisites) {
      return { totalAchievements: 0, avgPointsPerYear: 0, bestYear: null, yearsActive: 0 }
    }
    return calculateAchievementStats(currentProfile.prerequisites)
  }, [currentProfile])

  if (!currentProfile) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-600 font-semibold">Total Achievements</p>
        <p className="text-3xl font-bold text-blue-800">{stats.totalAchievements}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-600 font-semibold">Avg Points/Year</p>
        <p className="text-3xl font-bold text-green-800">
          {stats.avgPointsPerYear.toFixed(1)}
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-600 font-semibold">Best Year</p>
        <p className="text-3xl font-bold text-purple-800">{stats.bestYear || '-'}</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-600 font-semibold">Years Active</p>
        <p className="text-3xl font-bold text-orange-800">{stats.yearsActive}</p>
      </div>
    </div>
  )
}
```

### src/logic/achievementValidator.js

```javascript
import { InputValidator } from './validator'

export function validateAchievements(achievements) {
  const errors = {}
  const validAchievements = []

  achievements.forEach((ach, index) => {
    if (!ach.points) return // Skip empty rows

    const validation = InputValidator.validateGoldSeriesInput(ach)
    if (!validation.isValid) {
      errors[index] = validation.errors
    } else {
      validAchievements.push(ach)
    }
  })

  return {
    isValid: Object.keys(errors).length === 0 && validAchievements.length > 0,
    errors,
    validAchievements
  }
}

export function detectDuplicateAchievements(achievements) {
  const seen = new Set()
  const duplicates = []

  achievements.forEach(ach => {
    const key = `${ach.year}-${ach.type}-${ach.weaponGroup}-${ach.points}`
    if (seen.has(key)) {
      duplicates.push(key)
    }
    seen.add(key)
  })

  return duplicates
}
```

### src/logic/achievementAnalytics.js

```javascript
export function calculateAchievementStats(achievements) {
  if (!achievements || achievements.length === 0) {
    return {
      totalAchievements: 0,
      avgPointsPerYear: 0,
      bestYear: null,
      yearsActive: 0,
      pointsByYear: {}
    }
  }

  // Group by year
  const pointsByYear = {}
  achievements.forEach(ach => {
    const year = ach.year
    if (!pointsByYear[year]) {
      pointsByYear[year] = 0
    }
    pointsByYear[year] += ach.points || 0
  })

  const years = Object.keys(pointsByYear).map(Number)
  const bestYear = years.length > 0 ? Math.max(...years) : null
  const maxPoints = bestYear ? pointsByYear[bestYear] : 0

  return {
    totalAchievements: achievements.length,
    avgPointsPerYear: achievements.reduce((sum, a) => sum + (a.points || 0), 0) / years.length,
    bestYear,
    bestYearPoints: maxPoints,
    yearsActive: years.length,
    pointsByYear
  }
}
```

### src/pages/Settings.jsx (updated)

```jsx
import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import BatchAchievementForm from '../components/BatchAchievementForm'
import AchievementTimeline from '../components/AchievementTimeline'
import StatisticsDashboard from '../components/StatisticsDashboard'

export default function Settings() {
  const { currentProfile } = useProfile()
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'history'

  if (!currentProfile) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700">Please select or create a profile first</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">
          Profile: <span className="font-semibold">{currentProfile.displayName}</span> (Group {currentProfile.weaponGroupPreference})
        </p>
      </div>

      <StatisticsDashboard />

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'add'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Add Achievements
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          History
        </button>
      </div>

      {activeTab === 'add' && <BatchAchievementForm />}
      {activeTab === 'history' && <AchievementTimeline />}
    </div>
  )
}
```

## DESIGN DOCUMENT REFERENCES
- **03-Interaction-Design.md** - Settings View, Achievement Input
- **02-Data-Model.md** - Achievement Object structure
- **05-Technical-Architecture.md** - Undo/Redo Pattern

## PERFORMANCE NOTES
- Timeline sorted on-demand with useMemo
- Batch operations reduce re-renders
- Undo/redo uses immutable history pattern
- Analytics cached until achievements change

## DONE WHEN
- Batch form works with multiple rows
- Timeline displays chronologically
- Undo/redo fully functional
- Statistics calculate correctly
- All tests pass
- No console errors
