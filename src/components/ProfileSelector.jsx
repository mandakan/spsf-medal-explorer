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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create New Profile</h3>
            <form onSubmit={handleCreateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Weapon Group</label>
                <select
                  value={newWeaponGroup}
                  onChange={(e) => setNewWeaponGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  disabled={loading}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="R">R</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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
