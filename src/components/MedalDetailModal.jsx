import React, { useMemo } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'

export default function MedalDetailModal({ medalId, onClose }) {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const { currentProfile } = useProfile()
  const medal = medalDatabase?.getMedalById(medalId)

  const status = useMemo(() => {
    if (!statuses) return null
    return (
      statuses.unlocked.find(s => s.medalId === medalId) ||
      statuses.achievable.find(s => s.medalId === medalId) ||
      statuses.locked.find(s => s.medalId === medalId) ||
      null
    )
  }, [statuses, medalId])

  if (!medal) return null

  const statusLabel = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }[status?.status] || 'Unknown'

  const handleAddAchievement = () => {
    // TODO: Integrate with AchievementForm
    // For now, close modal and dispatch event to be handled elsewhere.
    window.dispatchEvent(new CustomEvent('openAchievementForm', { detail: { medalId } }))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              {medal.displayName}
            </h3>
            <p className="text-sm text-text-secondary">
              {medal.type} • {medal.tier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close medal details"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
            status?.status === 'unlocked' ? 'bg-yellow-100 text-yellow-800' :
            status?.status === 'achievable' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusLabel}
          </span>
        </div>

        {medal.description && (
          <div className="mb-4">
            <p className="text-text-secondary">{medal.description}</p>
          </div>
        )}

        {status?.details?.missingItems?.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Missing Prerequisites:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              {status.details.missingItems.map((item, i) => (
                <li key={i}>• {item.description}</li>
              ))}
            </ul>
          </div>
        )}

        {status?.details?.items?.length > 0 && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-sm font-semibold text-text-primary mb-2">
              Requirements:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              {status.details.items.map((item, i) => (
                <li key={i}>
                  {item.isMet ? '✓' : '○'} {item.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          {status?.status === 'achievable' && currentProfile && (
            <button
              onClick={handleAddAchievement}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
            >
              Add Achievement
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
