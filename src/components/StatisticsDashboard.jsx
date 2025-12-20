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
          {Number.isFinite(stats.avgPointsPerYear) ? stats.avgPointsPerYear.toFixed(1) : '0.0'}
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
