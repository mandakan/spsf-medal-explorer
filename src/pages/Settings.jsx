import React from 'react'
import { useProfile } from '../hooks/useProfile'
import AchievementForm from '../components/AchievementForm'

export default function Settings() {
  const { currentProfile } = useProfile()

  if (!currentProfile) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700">Please select or create a profile first</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Name</label>
                <p className="text-lg font-semibold text-text-primary">
                  {currentProfile.displayName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Weapon Group
                </label>
                <p className="text-lg font-semibold text-text-primary">
                  {currentProfile.weaponGroupPreference}
                </p>
              </div>
            </div>
          </div>

          <AchievementForm />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Data</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              📥 Export Data
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              📤 Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
