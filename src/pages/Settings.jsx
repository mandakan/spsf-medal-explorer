import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import BatchAchievementForm from '../components/BatchAchievementForm'
import AchievementTimeline from '../components/AchievementTimeline'
import StatisticsDashboard from '../components/StatisticsDashboard'
import { UndoRedoProvider } from '../contexts/UndoRedoContext'
import ProfilePromptBanner from '../components/ProfilePromptBanner'

export default function Settings() {
  const { currentProfile, setProfileFeature } = useProfile()
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'history'

  if (!currentProfile) {
    return <ProfilePromptBanner id="profile-picker-settings" />
  }

  return (
    <UndoRedoProvider>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Inställningar</h1>
          <p className="text-text-secondary">
            Profile: <span className="font-semibold">{currentProfile.displayName}</span> (Group {currentProfile.weaponGroupPreference})
          </p>
        </div>

        <StatisticsDashboard />

        <div className="card p-4">
          <h2 className="section-title mb-2">Funktioner</h2>
          <div className="flex items-start gap-3">
            <input
              id="ft-manual-unlock"
              type="checkbox"
              className="h-5 w-5 mt-0.5"
              checked={!!currentProfile?.features?.allowManualUnlock}
              onChange={(e) => setProfileFeature('allowManualUnlock', e.target.checked)}
            />
            <div>
              <label htmlFor="ft-manual-unlock" className="field-label mb-1">
                Tillåt manuell upplåsning av märken (förhandskrav gäller fortfarande)
              </label>
              <p className="field-hint">
                Du kan låsa upp märken vilket år som helst utan att möta kraven för dem. Förhandskrav och årskrav gäller fortfarande.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-3">
            <input
              id="ft-enforce-current-year"
              type="checkbox"
              className="h-5 w-5 mt-0.5"
              checked={!!currentProfile?.features?.enforceCurrentYearForSustained}
              onChange={(e) => setProfileFeature('enforceCurrentYearForSustained', e.target.checked)}
            />
            <div>
              <label htmlFor="ft-enforce-current-year" className="field-label mb-1">
                Kräv innevarande år för återkommande märken
              </label>
              <p className="field-hint">
                Märken som kräver återkommande aktiviteter kan bara låsas upp innevarande kalenderår.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex gap-2 border-b border-border"
          role="tablist"
          aria-label="Inställnings-sektion"
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
            Lägg till aktiviteter
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
            Historik
          </button>
        </div>

        {activeTab === 'add' && <BatchAchievementForm />}
        {activeTab === 'history' && <AchievementTimeline />}
      </div>
    </UndoRedoProvider>
  )
}
