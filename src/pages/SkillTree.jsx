import React, { useState, useEffect } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import ProfilePromptBanner from '../components/ProfilePromptBanner'
import { useProfile } from '../hooks/useProfile'
import GuestModeBanner from '../components/GuestModeBanner'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SkillTree() {

  const { currentProfile, startExplorerMode, hydrated } = useProfile()
  const isGuest = Boolean(currentProfile?.isGuest)
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false)
  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'
  const hasOnboardingChoice = (() => {
    try { return window.localStorage.getItem('app:onboardingChoice') } catch { return null }
  })()
  const showOnboarding = !isProfileLoading && !currentProfile && !hasOnboardingChoice && !dismissedOnboarding

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 768
    const isSkillTreeRoot = location.pathname === '/skill-tree'
    const fromClose = Boolean(location.state?.fromFullscreenClose)
    if (isMobile && isSkillTreeRoot && !fromClose) {
      navigate('/skill-tree/fullscreen', {
        replace: true,
        state: { backgroundLocation: location },
      })
    }
  }, [navigate, location])

  if (isProfileLoading) {
    return null
  }

  return (
    <div className="space-y-6">
      {showOnboarding ? (
        <div className="card p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title-skill">
          <h2 id="onboarding-title-skill" className="section-title mb-2">Hur vill du börja?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Utforska märken direkt eller skapa en profil för att spara ditt arbete.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary min-h-[44px]"
              onClick={() => {
                try { window.localStorage.setItem('app:onboardingChoice', 'guest') } catch { /* ignore unavailable storage */ }
                startExplorerMode()
              }}
            >
              Utforska utan att spara (Gästläge)
            </button>
            <button
              type="button"
              className="btn btn-primary min-h-[44px]"
              onClick={() => {
                try { window.localStorage.setItem('app:onboardingChoice', 'saved') } catch { /* ignore unavailable storage */ }
                setDismissedOnboarding(true)
              }}
            >
              Skapa profil
            </button>
          </div>
        </div>
      ) : isGuest ? (
        <GuestModeBanner idPrefix="skilltree" />
      ) : (
        <ProfilePromptBanner id="profile-picker-skill-tree" />
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary mb-1 sm:mb-0">Trädvy</h1>
      </div>

      <SkillTreeCanvas />
    </div>
  )
}
