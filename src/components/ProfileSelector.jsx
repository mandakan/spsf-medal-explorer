import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import MobileBottomSheet from './MobileBottomSheet'
import ProfileImportDialog from './ProfileImportDialog'

export default function ProfileSelector({ mode = 'picker', open = false, onClose, id = 'profile-picker' }) {
  const { profiles, currentProfile, loading, createProfile, updateProfile, selectProfile, deleteProfile } =
    useProfile()

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingProfile, setEditingProfile] = useState(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newDateOfBirth, setNewDateOfBirth] = useState('')
  const [showImport, setShowImport] = useState(false)
  const isPicker = mode === 'picker'

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
      console.error('Misslyckades spara profil:', err)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Är du säker? Det går inte att ångra.')) return
    try {
      await deleteProfile(userId)
    } catch (err) {
      console.error('Misslyckades ta bort profil:', err)
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
    <>
      {isPicker ? (
        <MobileBottomSheet id={id} title="Välj profil" open={open} onClose={onClose}>
          {profiles.length > 0 ? (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div key={profile.userId} className="flex gap-2">
                  <button
                    onClick={() => {
                      selectProfile(profile.userId)
                      onClose?.()
                    }}
                    className="btn btn-muted flex-1 justify-start text-left"
                  >
                    {profile.displayName} (Ålder {computeAge(profile.dateOfBirth) ?? '—'})
                  </button>
                  <button
                    onClick={() => {
                      setModalMode('edit')
                      setEditingProfile(profile)
                      setNewProfileName(profile.displayName || '')
                      setNewDateOfBirth(profile.dateOfBirth || '')
                      setShowModal(true)
                    }}
                    className="btn btn-secondary"
                  >
                    Ändra
                  </button>
                  <button
                    onClick={() => handleDelete(profile.userId)}
                    className="btn btn-danger"
                  >
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">Inga profiler ännu.</p>
          )}
          <button
            onClick={() => {
              setModalMode('create')
              setEditingProfile(null)
              setNewProfileName('')
              setNewDateOfBirth('')
              setShowModal(true)
            }}
            className="mt-3 btn btn-primary"
          >
            Skapa ny profil
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="mt-2 btn btn-secondary"
            aria-haspopup="dialog"
            aria-controls="profile-import-dialog"
          >
            Importera profil
          </button>
        </MobileBottomSheet>
      ) : (
        <div>
          {!currentProfile ? (
            <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-4">
              <p className="text-text-primary mb-3">No profile selected</p>
              {profiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {profiles.map((profile) => (
                    <div key={profile.userId} className="flex gap-2">
                      <button
                        onClick={() => selectProfile(profile.userId)}
                        className="btn btn-muted flex-1 justify-start text-left"
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
                        className="btn btn-secondary"
                      >
                        Ändra
                      </button>
                      <button
                        onClick={() => handleDelete(profile.userId)}
                        className="btn btn-danger"
                      >
                        Ta bort
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
                className="btn btn-primary"
              >
                Skapa ny profil
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="mt-2 btn btn-secondary"
                aria-haspopup="dialog"
                aria-controls="profile-import-dialog"
              >
                Importera profil
              </button>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border ring-1 ring-primary/20 rounded-lg p-4 mb-4">
              <p className="text-text-primary font-semibold">Profile: {currentProfile.displayName}</p>
              <p className="text-text-secondary text-sm">
                Ålder: {computeAge(currentProfile.dateOfBirth) ?? '—'}
              </p>
            </div>
          )}
        </div>
      )}

      <ProfileImportDialog id="profile-import-dialog" open={showImport} onClose={() => setShowImport(false)} />

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            className="w-[min(92vw,32rem)] max-h-[85vh] overflow-auto rounded-xl bg-bg-secondary border border-border shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <h2 id="create-profile-title" className="text-2xl font-bold text-text-primary">
                {modalMode === 'edit' ? 'Ändra profil' : 'Skapa ny profil'}
              </h2>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="input"
                  placeholder="Ditt namn"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">Födelsedatum</label>
                <input
                  type="date"
                  value={newDateOfBirth}
                  onChange={(e) => setNewDateOfBirth(e.target.value)}
                  className="input"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-text-secondary">Används för att beräkna åldersberoende krav (tex gränser för precisionsserier)</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary disabled:opacity-50"
                  disabled={loading}
                >
                  {modalMode === 'edit' ? 'Spara' : 'Skapa'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
