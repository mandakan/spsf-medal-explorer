import React, { useState } from 'react'
import { useAchievementHistory } from '../hooks/useAchievementHistory'

export default function AchievementCard({ achievement }) {
  const { updateOne, removeOne } = useAchievementHistory()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(achievement)

  const handleDelete = async () => {
    if (!confirm('Delete this achievement?')) return
    try {
      await removeOne(achievement.id)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleSave = async () => {
    try {
      const ok = await updateOne(editedData)
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
          {(achievement.date || '').toString()} • {achievement.points} points
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
