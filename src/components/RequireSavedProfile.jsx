import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from './ProfileSelector'

export default function RequireSavedProfile({ children }) {
  const { currentProfile } = useProfile()
  const navigate = useNavigate()
  const [showProfileSheet, setShowProfileSheet] = React.useState(false)
  const [sheetForceCreate, setSheetForceCreate] = React.useState(true)

  if (currentProfile && !currentProfile.isGuest) {
    return children
  }

  return (
    <div className="p-6">
      <div
        className="card block p-6 w-full min-w-full max-w-xl mx-auto"
        role="region"
        aria-labelledby="profile-required-heading"
      >
        <h2 id="profile-required-heading" className="section-title mb-2">Profil krävs för att fortsätta</h2>
        <div className="text-sm text-muted-foreground space-y-3 mb-4">
          <p>För att använda Inställningar och import/export behöver du en sparad profil.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Spara dina framsteg och säkerhetskopiera data</li>
            <li>Hantera inställningar per profil</li>
            <li>Exportera och importera mellan enheter</li>
          </ul>
          {currentProfile?.isGuest && (
            <p>Du kan spara ditt nuvarande Gästläge som en profil och fortsätta utan att förlora något.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary min-h-[44px]"
            autoFocus
            onClick={() => {
              setSheetForceCreate(true)
              setShowProfileSheet(true)
            }}
            aria-haspopup="dialog"
            aria-controls="save-progress-picker-guard"
          >
            Skapa profil
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-[44px]"
            onClick={() => {
              setSheetForceCreate(false)
              setShowProfileSheet(true)
            }}
            aria-haspopup="dialog"
            aria-controls="save-progress-picker-guard"
          >
            Välj profil
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-[44px]"
            onClick={() => navigate('/medals')}
          >
            Tillbaka till märken
          </button>
        </div>
      </div>

      <ProfileSelector
        id="save-progress-picker-guard"
        mode="picker"
        open={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        forceCreate={sheetForceCreate}
        convertGuest
      />
    </div>
  )
}
