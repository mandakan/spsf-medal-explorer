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
      <div className="card p-4">
        <p className="text-sm text-muted-foreground font-semibold">Totala Aktiviteter</p>
        <p className="text-3xl font-bold text-foreground">{stats.totalAchievements}</p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-muted-foreground font-semibold">Genomsnitt Poäng/År</p>
        <p className="text-3xl font-bold text-foreground">
          {Number.isFinite(stats.avgPointsPerYear) ? stats.avgPointsPerYear.toFixed(1) : '0.0'}
        </p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-muted-foreground font-semibold">Bästa År</p>
        <p className="text-3xl font-bold text-foreground">{stats.bestYear || '-'}</p>
      </div>

      <div className="card p-4">
        <p className="text-sm text-muted-foreground font-semibold">Aktiva År</p>
        <p className="text-3xl font-bold text-foreground">{stats.yearsActive}</p>
      </div>
    </div>
  )
}
