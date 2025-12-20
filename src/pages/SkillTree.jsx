import React from 'react'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'

export default function SkillTree() {
  const statuses = useAllMedalStatuses()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Skill Tree</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="font-bold text-yellow-800">Unlocked</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {statuses.unlocked.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-bold text-green-800">Achievable</h3>
          <p className="text-2xl font-bold text-green-600">
            {statuses.achievable.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-bold text-gray-800">Locked</h3>
          <p className="text-2xl font-bold text-gray-600">
            {statuses.locked.length}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Canvas visualization coming in Phase 2. For now, use the Medals list view.
        </p>
      </div>
    </div>
  )
}
