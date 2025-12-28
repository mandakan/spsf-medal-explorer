import React, { useState, useEffect } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import ProfilePromptBanner from '../components/ProfilePromptBanner'
import { useProfile } from '../hooks/useProfile'
import GuestModeBanner from '../components/GuestModeBanner'
import { STATUS_ORDER, getStatusProps } from '../config/statuses'
import StatusIcon from '../components/StatusIcon'
import { getStatusColorVar } from '../config/statusColors'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()
  const statusCards = React.useMemo(() => (
    STATUS_ORDER.map(key => {
      const s = getStatusProps(key)
      return {
        key,
        label: s.label,
        count: Array.isArray(statuses?.[key]) ? statuses[key].length : 0,
      }
    })
  ), [statuses])

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
    if (typeof window !== 'undefined' && window.innerWidth < 768 && location.pathname === '/skill-tree') {
      navigate('/skill-tree/fullscreen', { replace: true })
    }
  }, [navigate, location.pathname])

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
        <div
          role="tablist"
          aria-label="Trädvy med märken"
          className="inline-flex gap-2 flex-wrap sm:flex-nowrap"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              setViewMode(viewMode === 'canvas' ? 'stats' : 'canvas')
              e.preventDefault()
            }
          }}
        >
          <button
            role="tab"
            id="tab-canvas"
            aria-controls="panel-canvas"
            aria-selected={viewMode === 'canvas'}
            className={`btn ${viewMode === 'canvas' ? 'btn-primary' : 'btn-muted'} min-h-[44px]`}
            onClick={() => setViewMode('canvas')}
          >
            <span aria-hidden="true">🎨</span> Canvas
          </button>
          <button
            role="tab"
            id="tab-stats"
            aria-controls="panel-stats"
            aria-selected={viewMode === 'stats'}
            className={`btn ${viewMode === 'stats' ? 'btn-primary' : 'btn-muted'} min-h-[44px]`}
            onClick={() => setViewMode('stats')}
          >
            <span aria-hidden="true">📊</span> Statistik
          </button>
        </div>
      </div>

      {viewMode === 'canvas' ? (
        <div role="tabpanel" id="panel-canvas" aria-labelledby="tab-canvas">
          <SkillTreeCanvas />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-stats"
          aria-labelledby="tab-stats"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statusCards.map(({ key, label, count }) => (
            <div key={key} className="card p-6">
              <p
                className="text-sm font-semibold inline-flex items-center gap-2"
                style={{ color: `var(${getStatusColorVar(key)})` }}
              >
                <StatusIcon status={key} className="w-4 h-4" />
                <span>{label}</span>
              </p>
              <p className="text-3xl font-bold text-foreground">{count}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
