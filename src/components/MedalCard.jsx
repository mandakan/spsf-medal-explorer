import React, { useMemo } from 'react'
import { useMedalCalculator } from '../hooks/useMedalCalculator'

export default function MedalCard({ medal }) {
  const calculator = useMedalCalculator()
  const status = useMemo(() => {
    if (!calculator || !medal?.id) return null
    try {
      return calculator.evaluateMedal(medal.id)
    } catch {
      return null
    }
  }, [calculator, medal?.id])

  const statusColors = {
    unlocked: 'bg-yellow-50 border-yellow-200',
    achievable: 'bg-green-50 border-green-200',
    locked: 'bg-gray-50 border-gray-200'
  }

  const statusBadge = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }

  const statusClass = status?.status || 'locked'

  return (
    <div
      className={`rounded-lg border p-4 ${statusColors[statusClass]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-text-primary">{medal.displayName}</h3>
        <span className="text-sm font-semibold">
          {statusBadge[statusClass]}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {medal.type} • {medal.tier}
      </p>

      {medal.description && (
        <p className="text-sm mb-3">{medal.description}</p>
      )}

      {status && status.details && (
        <div className="text-xs text-text-secondary">
          {status.details.items?.length > 0 && (
            <p>Requirements: {status.details.items.length}</p>
          )}
        </div>
      )}
    </div>
  )
}
