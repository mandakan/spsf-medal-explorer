import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProfileSelector from './ProfileSelector'
import { useProfile } from '../hooks/useProfile'
import Icon from './Icon'
import { useOnboardingTour } from '../hooks/useOnboardingTour'

const navItems = [
  { path: '/skill-tree', label: 'Märkesträd' },
  { path: '/medals', label: 'Alla märken' },
  { path: '/data', label: 'Data' },
  { path: '/settings', label: 'Inställningar' },
  { path: '/about', label: 'Om' }
]

const MANUAL_TOUR_KEY = 'app:onboardingTour:manualStart'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [openedAtPath, setOpenedAtPath] = useState(null)
  const open = openedAtPath === location.pathname
  const { currentProfile } = useProfile()
  const [profilePickerOpen, setProfilePickerOpen] = useState(false)
  const [guidePromptOpen, setGuidePromptOpen] = useState(false)
  const tour = useOnboardingTour()

  const profileInitials = currentProfile?.displayName
    ? currentProfile.displayName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : null

  // Allow closing with Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenedAtPath(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const startMedalsGuideHere = () => {
    setGuidePromptOpen(false)
    setOpenedAtPath(null)
    setProfilePickerOpen(false)
    tour.start()
  }

  const handleStartGuideClick = () => {
    // Current guide is for /medals. Avoid magic navigation: ask if user is elsewhere.
    if (location.pathname === '/medals') {
      startMedalsGuideHere()
    } else {
      setGuidePromptOpen(true)
    }
  }

  const requestManualStartAndGoToMedals = () => {
    try {
      sessionStorage.setItem(MANUAL_TOUR_KEY, 'medals')
    } catch {
      // ignore
    }
    setGuidePromptOpen(false)
    setOpenedAtPath(null)
    setProfilePickerOpen(false)
    navigate('/medals')
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-2">
          {/* Skip link (WCAG 2.4.1) */}
          <a
            href="#main"
            className="absolute -top-10 left-2 focus:top-2 focus:left-2 focus:z-[60] btn btn-primary"
          >
            Hoppa till innehåll
          </a>

          {/* Top row: brand + controls */}
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              onClick={() => { setOpenedAtPath(null); setProfilePickerOpen(false); setGuidePromptOpen(false) }}
              className="inline-flex items-center gap-2 text-2xl font-bold leading-tight break-words text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              <Icon name="Award" className="w-6 h-6 shrink-0" />
              <span>Skyttemärken</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Guide (desktop quick access) */}
              <button
                type="button"
                onClick={handleStartGuideClick}
                className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-3 rounded-md btn btn-muted"
                aria-haspopup="dialog"
                aria-controls="guide-prompt"
              >
                Guide
              </button>

              <button
                type="button"
                onClick={() => setProfilePickerOpen(true)}
                className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full btn btn-muted"
                aria-haspopup="dialog"
                aria-controls="profile-picker"
                aria-label={currentProfile?.displayName ? `Aktiv profil: ${currentProfile.displayName}` : 'Välj profil'}
                title={currentProfile?.displayName || 'Välj profil'}
              >
                {profileInitials || '?'}
              </button>

              {/* Desktop nav (≥sm) */}
              <nav aria-label="Primary" className="hidden sm:block">
                <ul className="flex gap-2">
                  {navItems.map(item => {
                    const isActive = location.pathname === item.path
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setProfilePickerOpen(false)}
                          className={`inline-flex items-center min-h-[44px] px-4 py-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-surface'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Hamburger (mobile only) */}
              <button
                type="button"
                onClick={() => setOpenedAtPath(cur => (cur === location.pathname ? null : location.pathname))}
                className="sm:hidden inline-flex items-center justify-center h-11 w-11 rounded-md btn btn-muted"
                aria-label="Växla meny"
                aria-controls="mobile-primary-nav"
                aria-expanded={open ? 'true' : 'false'}
              >
                <Icon name="Menu" size={20} className="shrink-0" />
              </button>
            </div>
          </div>

          {/* Mobile nav (collapsible) */}
          <nav
            id="mobile-primary-nav"
            aria-label="Primary"
            className={`${open ? 'mt-2' : 'hidden'} sm:hidden`}
          >
            <ul className="grid grid-cols-2 gap-2">
              <li className="col-span-2">
                <button
                  type="button"
                  onClick={handleStartGuideClick}
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded transition-colors btn btn-muted"
                  aria-haspopup="dialog"
                  aria-controls="guide-prompt"
                >
                  Guide
                </button>
              </li>

              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => { setOpenedAtPath(null); setProfilePickerOpen(false); setGuidePromptOpen(false) }}
                      className={`inline-flex items-center min-h-[44px] px-4 py-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-surface'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      <ProfileSelector id="profile-picker" mode="picker" open={profilePickerOpen} onClose={() => setProfilePickerOpen(false)} />

      {guidePromptOpen && (
        <div
          id="guide-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-prompt-title"
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setGuidePromptOpen(false)
          }}
        >
          <div className="card w-full sm:w-[min(520px,90vw)] rounded-t-2xl sm:rounded-xl p-4 sm:p-6">
            <h2 id="guide-prompt-title" className="text-lg font-semibold text-foreground">
              Starta guide
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Den här guiden finns i Märkeslistan.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                className="btn btn-secondary min-h-[44px]"
                onClick={() => setGuidePromptOpen(false)}
              >
                Avbryt
              </button>
              <button
                type="button"
                className="btn btn-primary min-h-[44px]"
                onClick={requestManualStartAndGoToMedals}
              >
                Öppna Märkeslista
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
