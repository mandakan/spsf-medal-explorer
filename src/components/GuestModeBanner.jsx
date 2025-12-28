import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from './ProfileSelector'
import ConfirmDialog from './ConfirmDialog'
import Icon from './Icon'

export default function GuestModeBanner({ idPrefix = 'default' }) {
  const { resetCurrentProfileData } = useProfile()
  const [openPicker, setOpenPicker] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  return (
    <>
      <div className="card p-4" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <Icon name="Compass" className="w-6 h-6 shrink-0" />
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
                onClick={() => setShowConfirmReset(true)}
              >
                Återställ alla
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        id={`reset-confirm-${idPrefix}`}
        open={showConfirmReset}
        onCancel={() => setShowConfirmReset(false)}
        onConfirm={async () => {
          setShowConfirmReset(false)
          await resetCurrentProfileData()
        }}
        title="Återställa allt?"
        description="Detta rensar alla tillfälliga framsteg (märken och förkunskaper) i gästläget. Denna åtgärd går inte att ångra."
        confirmLabel="Återställ"
        cancelLabel="Avbryt"
        variant="danger"
      />
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
