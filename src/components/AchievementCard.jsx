import React, { useMemo, useState } from 'react'
import { useAchievementHistory } from '../hooks/useAchievementHistory'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import UniversalAchievementLogger from './UniversalAchievementLogger'
import { UndoRedoProvider } from '../contexts/UndoRedoContext'

export default function AchievementCard({ achievement }) {
  const { updateAchievement, removeAchievement } = useAchievementHistory()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(achievement)
  const [showLogger, setShowLogger] = useState(false)
  const { medalDatabase } = useMedalDatabase()
  const medal = useMemo(
    () =>
      medalDatabase?.getMedalById(achievement.medalId) || {
        id: achievement.medalId,
        displayName: achievement.medalId,
      },
    [medalDatabase, achievement.medalId]
  )

  const handleDelete = async () => {
    if (!confirm('Delete this achievement?')) return
    try {
      await removeAchievement(achievement.id)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleSave = async () => {
    try {
      const yearNum = editedData.year === '' ? undefined : Number(editedData.year)
      const pointsNum = editedData.points === '' ? undefined : Number(editedData.points)
      const payload = {
        ...editedData,
        id: achievement.id,
        medalId: achievement.medalId,
        year: Number.isFinite(yearNum)
          ? yearNum
          : (editedData.date ? new Date(editedData.date).getFullYear() : achievement.year),
        points: Number.isFinite(pointsNum) ? pointsNum : achievement.points,
      }
      const ok = await updateAchievement(payload)
      if (ok) setIsEditing(false)
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const typeLabel = {
    'gold_series': 'Gold Series',
    'competition_result': 'Competition Result',
    'special_achievement': 'Special Achievement',
    'standard_medal': 'Standard Medal'
  }[achievement.type] || achievement.type

  if (isEditing) {
    return (
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground">Year</label>
            <input
              type="number"
              value={editedData.year ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setEditedData(prev => ({ ...prev, year: v === '' ? '' : parseInt(v, 10) }))
              }}
              className="input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Points</label>
            <input
              type="number"
              value={editedData.points ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setEditedData(prev => ({ ...prev, points: v === '' ? '' : parseInt(v, 10) }))
              }}
              className="input"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1 text-sm"
            aria-label="Save achievement changes"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-muted flex-1 text-sm"
            aria-label="Cancel editing"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card p-4 flex justify-between items-start">
        <div>
          <div className="flex gap-2 items-center mb-1">
            <span className="font-semibold text-text-primary">{typeLabel}</span>
            <span className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-secondary">
              Group {achievement.weaponGroup}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {(achievement.date || '').toString()} • {achievement.points} points
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-muted text-sm"
            aria-label={`Edit achievement ${achievement.id}`}
          >
            Edit
          </button>
          <button
            onClick={() => setShowLogger(true)}
            className="btn btn-primary text-sm"
            aria-label={`Log new achievement for medal ${achievement.medalId}`}
          >
            Log
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-muted text-red-600 text-sm"
            aria-label={`Delete achievement ${achievement.id}`}
          >
            Delete
          </button>
        </div>
      </div>

      {showLogger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => setShowLogger(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Log achievement"
            className="relative z-10 w-full max-w-lg"
          >
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-text-primary">Log achievement</h3>
                <button
                  className="btn btn-muted text-sm"
                  onClick={() => setShowLogger(false)}
                  aria-label="Close log achievement form"
                >
                  Close
                </button>
              </div>
              <UndoRedoProvider>
                <UniversalAchievementLogger
                  medal={medal}
                  onSuccess={() => setShowLogger(false)}
                />
              </UndoRedoProvider>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
