import React from 'react'
import { useProfile } from '../hooks/useProfile'
import AchievementForm from '../components/AchievementForm'

export default function Settings() {
  const { currentProfile } = useProfile()

  if (!currentProfile) {
    return (
      <div className="card p-4">
        <p className="text-foreground">Please select or create a profile first</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Name</label>
                <p className="text-lg font-semibold text-foreground">
                  {currentProfile.displayName}
                </p>
              </div>
              <div>
                <label className="field-label">
                  Weapon Group
                </label>
                <p className="text-lg font-semibold text-foreground">
                  {currentProfile.weaponGroupPreference}
                </p>
              </div>
            </div>
          </div>

          <AchievementForm />
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Data</h2>
          <div className="space-y-3">
            <button className="btn btn-primary w-full">
              📥 Export Data
            </button>
            <button className="btn btn-primary w-full">
              📤 Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
