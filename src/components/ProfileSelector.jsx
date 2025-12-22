import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

export default function ProfileSelector() {
  const { profiles, currentProfile, loading, createProfile, updateProfile, selectProfile, deleteProfile } =
    useProfile()

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingProfile, setEditingProfile] = useState(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newDateOfBirth, setNewDateOfBirth] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newProfileName.trim() || !newDateOfBirth) return

    try {
      if (modalMode === 'edit' && editingProfile) {
        await updateProfile({
          ...editingProfile,
          displayName: newProfileName.trim(),
          dateOfBirth: newDateOfBirth,
        })
      } else {
        await createProfile(newProfileName.trim(), newDateOfBirth)
      }
      setNewProfileName('')
      setNewDateOfBirth('')
      setEditingProfile(null)
      setShowModal(false)
    } catch (err) {
      console.error('Failed to save profile:', err)
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

  const computeAge = (dob) => {
    if (!dob) return null
    const d = new Date(dob)
    if (Number.isNaN(d.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
    return age
  }

  return (
    <div>
      {!currentProfile ? (
        <div className="bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p className="text-text-primary mb-3">No profile selected</p>
          {profiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {profiles.map((profile) => (
                <div key={profile.userId} className="flex gap-2">
                  <button
                    onClick={() => selectProfile(profile.userId)}
                    className="flex-1 text-left px-4 py-2 bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded hover:bg-gray-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    {profile.displayName} (Age {computeAge(profile.dateOfBirth) ?? '—'})
                  </button>
                  <button
                    onClick={() => {
                      setModalMode('edit')
                      setEditingProfile(profile)
                      setNewProfileName(profile.displayName || '')
                      setNewDateOfBirth(profile.dateOfBirth || '')
                      setShowModal(true)
                    }}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-gray-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.userId)}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600/60"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setModalMode('create')
              setEditingProfile(null)
              setNewProfileName('')
              setNewDateOfBirth('')
              setShowModal(true)
            }}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Create New Profile
          </button>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-emerald-300 ring-1 ring-emerald-500/20 dark:border-emerald-700 dark:ring-emerald-400/30 rounded-lg p-4 mb-4">
          <p className="text-text-primary font-semibold">Profile: {currentProfile.displayName}</p>
          <p className="text-text-secondary text-sm">
            Age: {computeAge(currentProfile.dateOfBirth) ?? '—'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            className="w-[min(92vw,32rem)] max-h-[85vh] overflow-auto rounded-xl bg-bg-secondary border border-slate-200 dark:border-slate-700 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <h2 id="create-profile-title" className="text-2xl font-bold text-text-primary">
                {modalMode === 'edit' ? 'Edit Profile' : 'Create New Profile'}
              </h2>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-bg-secondary text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Date of Birth</label>
                <input
                  type="date"
                  value={newDateOfBirth}
                  onChange={(e) => setNewDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-text-secondary">Used to determine age-based requirements (e.g., precision series thresholds)</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  disabled={loading}
                >
                  {modalMode === 'edit' ? 'Save' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 text-text-primary hover:bg-gray-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
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
