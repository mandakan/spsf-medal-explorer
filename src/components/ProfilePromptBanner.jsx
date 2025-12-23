import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from './ProfileSelector'

export default function ProfilePromptBanner({ id = 'profile-picker-inline' }) {
  const { currentProfile } = useProfile()
  const [open, setOpen] = useState(false)

  if (currentProfile) return null

  return (
    <div className="card p-4" role="region" aria-label="Profil krävs">
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className="text-xl leading-none">👤</div>
        <div className="flex-1">
          <p className="text-foreground mb-2">
            Välj eller skapa en profil.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px]"
            aria-haspopup="dialog"
            aria-controls={id}
          >
            Profil
          </button>
        </div>
      </div>

      <ProfileSelector id={id} mode="picker" open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
