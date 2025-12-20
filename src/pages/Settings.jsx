import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import BatchAchievementForm from '../components/BatchAchievementForm'
import AchievementTimeline from '../components/AchievementTimeline'
import StatisticsDashboard from '../components/StatisticsDashboard'
import { UndoRedoProvider } from '../contexts/UndoRedoContext'

export default function Settings() {
  const { currentProfile } = useProfile()
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'history'

  if (!currentProfile) {
    return (
      <div className="card p-4">
        <p className="text-foreground">Please select or create a profile first</p>
      </div>
    )
  }

  return (
    <UndoRedoProvider>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">
            Profile: <span className="font-semibold">{currentProfile.displayName}</span> (Group {currentProfile.weaponGroupPreference})
          </p>
        </div>

        <StatisticsDashboard />

        <div
          className="flex gap-2 border-b border-border"
          role="tablist"
          aria-label="Settings sections"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'add'}
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 font-medium border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'add'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Add Achievements
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'add' && <BatchAchievementForm />}
        {activeTab === 'history' && <AchievementTimeline />}
      </div>
    </UndoRedoProvider>
  )
}
