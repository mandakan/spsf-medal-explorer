import React, { useMemo, useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import AchievementCard from './AchievementCard'
import { achievementsToCSV, downloadCSV } from '../utils/achievementExport'

export default function AchievementTimeline() {
  const { currentProfile } = useProfile()
  const [filterYear, setFilterYear] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [filterGroup, setFilterGroup] = useState(null)

  const sortedAchievements = useMemo(() => {
    if (!currentProfile?.prerequisites) return []

    let achievements = [...currentProfile.prerequisites]

    if (filterYear) {
      achievements = achievements.filter(a => a.year === filterYear)
    }
    if (filterType) {
      achievements = achievements.filter(a => a.type === filterType)
    }
    if (filterGroup) {
      achievements = achievements.filter(a => a.weaponGroup === filterGroup)
    }

    return achievements.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'))
  }, [currentProfile, filterYear, filterType, filterGroup])

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

  const handleExport = () => {
    const csv = achievementsToCSV(sortedAchievements)
    downloadCSV(csv, 'achievement-history.csv')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary">Filters</h3>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-hover text-sm"
          >
            Export CSV
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
              <option value="competition_result">Competition Result</option>
              <option value="standard_medal">Standard Medal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Group</label>
            <select
              value={filterGroup || ''}
              onChange={(e) => setFilterGroup(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">All Groups</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="R">R</option>
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
