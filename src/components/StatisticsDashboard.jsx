import React, { useMemo } from 'react'
import { useProfile } from '../hooks/useProfile'
import { calculateAchievementStats } from '../logic/achievementAnalytics'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { STATUS_ORDER, getStatusProps } from '../config/statuses'
import Icon from './Icon'

export default function StatisticsDashboard() {
  const { currentProfile } = useProfile()

  const stats = useMemo(() => {
    if (!currentProfile?.prerequisites) {
      return { totalAchievements: 0, avgPointsPerYear: 0, bestYear: null, yearsActive: 0 }
    }
    return calculateAchievementStats(currentProfile.prerequisites)
  }, [currentProfile])

  const medalStatuses = useAllMedalStatuses()

  const statusCards = useMemo(() => {
    return STATUS_ORDER.map(key => {
      const s = getStatusProps(key)
      return {
        key,
        label: s.label,
        icon: s.icon,
        count: Array.isArray(medalStatuses?.[key]) ? medalStatuses[key].length : 0,
      }
    })
  }, [medalStatuses])

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

      {statusCards.map(({ key, label, icon, count }) => (
        <div key={key} className="card p-4">
          <p className="text-sm text-muted-foreground font-semibold inline-flex items-center gap-2">
            <Icon name={icon} className="w-4 h-4" aria-hidden="true" />
            <span>{label}</span>
          </p>
          <p className="text-3xl font-bold text-foreground">{count}</p>
        </div>
      ))}
    </div>
  )
}
