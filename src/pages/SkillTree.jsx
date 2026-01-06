import React, { useCallback, useEffect } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import ProfileExperienceBanner from '../components/ProfileExperienceBanner'
import { useProfile } from '../hooks/useProfile'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOnboardingTour } from '../hooks/useOnboardingTour'
import { getReleaseId, getLastSeen, isProductionEnv } from '../utils/whatsNew'
import { MANUAL_TOUR_KEY } from '../utils/onboardingTour'

export default function SkillTree() {

  const { currentProfile, hydrated } = useProfile()
  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'

  const navigate = useNavigate()
  const location = useLocation()
  const tour = useOnboardingTour()

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

  const startGuideFromHere = useCallback(() => {
    if (tour?.open) return
    tour.start('tree-view')
  }, [tour])

  // Manual start request (race-safe): consumed once when arriving at /skill-tree
  useEffect(() => {
    if (isProfileLoading) return
    if (location.pathname !== '/skill-tree') return
    if (tour?.open) return

    let requested = null
    try {
      requested = sessionStorage.getItem(MANUAL_TOUR_KEY)
    } catch {
      requested = null
    }
    if (requested !== 'tree-view') return

    try {
      sessionStorage.removeItem(MANUAL_TOUR_KEY)
    } catch {
      // ignore
    }

    startGuideFromHere()
  }, [isProfileLoading, location.pathname, tour, startGuideFromHere])

  // Auto-start onboarding tour on first visit to /skill-tree (after hydration and after "What's New" has been seen)
  useEffect(() => {
    if (isProfileLoading) return
    if (location.pathname !== '/skill-tree') return
    if (tour?.open) return

    // If a manual start is pending, let the manual-start effect handle it.
    try {
      if (sessionStorage.getItem(MANUAL_TOUR_KEY) === 'tree-view') return
    } catch {
      // ignore
    }

    if (!tour?.canAutoStart?.('tree-view')) return

    if (isProductionEnv()) {
      const releaseId = getReleaseId()
      const last = getLastSeen()
      if (releaseId && last !== releaseId) return
    }

    startGuideFromHere()
  }, [isProfileLoading, location.pathname, tour, startGuideFromHere])

  if (isProfileLoading) {
    return null
  }

  return (
    <div className="space-y-6">
      <ProfileExperienceBanner idPrefix="skilltree" promptId="profile-picker-skill-tree" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-text-primary mb-1 sm:mb-0">Trädvy</h1>
          <button
            type="button"
            onClick={startGuideFromHere}
            className="text-sm underline hover:no-underline text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded"
          >
            Visa guide
          </button>
        </div>
      </div>

      <SkillTreeCanvas />
    </div>
  )
}
