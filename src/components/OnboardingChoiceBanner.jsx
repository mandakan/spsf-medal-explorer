import React from 'react'
import Icon from './Icon'

export default function OnboardingChoiceBanner({ idPrefix = 'default', onChooseGuest, onChooseSaved }) {
  const titleId = `onboarding-title-${idPrefix}`
  return (
    <div className="card p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <h2 id={titleId} className="section-title mb-2">Hur vill du börja?</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Utforska märken direkt eller skapa en profil för att spara ditt arbete.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary min-h-[44px]"
          onClick={onChooseGuest}
        >
          <Icon name="Compass" className="w-4 h-4" />
          Utforska utan att spara (Gästläge)
        </button>
        <button
          type="button"
          className="btn btn-primary min-h-[44px]"
          onClick={onChooseSaved}
        >
          <Icon name="UserPlus" className="w-4 h-4" />
          Skapa profil
        </button>
      </div>
    </div>
  )
}
