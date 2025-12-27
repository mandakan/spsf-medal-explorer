import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from './ProfileSelector'

export default function GuestModeBanner({ idPrefix = 'default' }) {
  const { resetCurrentProfileData } = useProfile()
  const [openPicker, setOpenPicker] = useState(false)

  return (
    <>
      <div className="card p-4" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div aria-hidden="true" className="text-xl leading-none">🧭</div>
          <div className="flex-1">
            <p className="mb-2">Gästläge: framsteg sparas tillfälligt.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary min-h-[44px]"
                onClick={() => setOpenPicker(true)}
              >
                Spara framsteg
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-[44px]"
                onClick={async () => {
                  if (window.confirm('Återställa alla märken och förkunskaper? Detta går inte att ångra.')) {
                    await resetCurrentProfileData()
                  }
                }}
              >
                Återställ alla
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProfileSelector
        id={`save-progress-picker-${idPrefix}`}
        mode="picker"
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        forceCreate
        convertGuest
      />
    </>
  )
}
