import React, { useState } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Skill Tree</h1>
        <div className="space-x-2">
          <button
            onClick={() => setViewMode('canvas')}
            aria-pressed={viewMode === 'canvas'}
            className={`px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              viewMode === 'canvas'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-50'
            }`}
          >
            🎨 Canvas View
          </button>
          <button
            onClick={() => setViewMode('stats')}
            aria-pressed={viewMode === 'stats'}
            className={`px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              viewMode === 'stats'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-50'
            }`}
          >
            📊 Stats View
          </button>
        </div>
      </div>

      {viewMode === 'canvas' ? (
        <SkillTreeCanvas />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">Unlocked</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
              {statuses.unlocked.length}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              Medals you've already earned
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-bold text-green-900 dark:text-green-200 mb-2">Achievable</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">
              {statuses.achievable.length}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Next medals you can unlock
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="font-bold text-gray-900 dark:text-slate-200 mb-2">Locked</h3>
            <p className="text-3xl font-bold text-gray-600 dark:text-slate-300">
              {statuses.locked.length}
            </p>
            <p className="text-sm text-gray-700 dark:text-slate-300 mt-2">
              Future goals to work toward
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
