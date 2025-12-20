import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

export default function ProfileSelector() {
  const { profiles, currentProfile, loading, createProfile, selectProfile, deleteProfile } =
    useProfile()

  const [showModal, setShowModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newWeaponGroup, setNewWeaponGroup] = useState('A')

  const handleCreateProfile = async (e) => {
    e.preventDefault()
    if (!newProfileName.trim()) return

    try {
      await createProfile(newProfileName, newWeaponGroup)
      setNewProfileName('')
      setShowModal(false)
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure? This cannot be undone.')) return
    try {
      await deleteProfile(userId)
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  return (
    <div>
      {!currentProfile ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-700 mb-3">No profile selected</p>
          {profiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {profiles.map((profile) => (
                <div key={profile.userId} className="flex gap-2">
                  <button
                    onClick={() => selectProfile(profile.userId)}
                    className="flex-1 text-left px-4 py-2 bg-white border border-blue-200 rounded hover:bg-blue-50"
                  >
                    {profile.displayName} (Group {profile.weaponGroupPreference})
                  </button>
                  <button
                    onClick={() => handleDelete(profile.userId)}
                    className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Create New Profile
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700 font-semibold">Profile: {currentProfile.displayName}</p>
          <p className="text-green-600 text-sm">
            Weapon Group: {currentProfile.weaponGroupPreference}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            className="w-[min(92vw,32rem)] max-h-[85vh] overflow-auto rounded-xl bg-white shadow-2xl"
          >
            <form onSubmit={handleCreateProfile} className="p-6 space-y-5">
              <h2 id="create-profile-title" className="text-2xl font-bold text-text-primary">
                Create New Profile
              </h2>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Weapon Group</label>
                <select
                  value={newWeaponGroup}
                  onChange={(e) => setNewWeaponGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="R">R</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                  disabled={loading}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-text-primary hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
