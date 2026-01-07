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
  { path: '/about', label: 'Om' },
  { path: '/help', label: 'Hjälp' }
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [openedAtPath, setOpenedAtPath] = useState(null)
  const open = openedAtPath === location.pathname
  const { currentProfile } = useProfile()
  const [profilePickerOpen, setProfilePickerOpen] = useState(false)
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

  const handleHelpClick = (e) => {
    e.preventDefault()
    setOpenedAtPath(null)
    setProfilePickerOpen(false)

    // Contextual behavior based on current page
    if (location.pathname === '/medals') {
      // Start medals guide immediately
      tour.start()
    } else if (location.pathname === '/skill-tree' || location.pathname === '/skill-tree/fullscreen') {
      // Start tree-view guide immediately
      tour.start()
    } else {
      // Navigate to help page for all other pages
      navigate('/help')
    }
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
              onClick={() => { setOpenedAtPath(null); setProfilePickerOpen(false) }}
              className="inline-flex items-center gap-2 text-2xl font-bold leading-tight break-words text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              <Icon name="Award" className="w-6 h-6 shrink-0" />
              <span>Skyttemärken</span>
            </Link>

            <div className="flex items-center gap-2">
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
                    const isHelp = item.path === '/help'
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={isHelp ? handleHelpClick : () => setProfilePickerOpen(false)}
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
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                const isHelp = item.path === '/help'
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={isHelp ? handleHelpClick : () => { setOpenedAtPath(null); setProfilePickerOpen(false) }}
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
    </header>
  )
}
