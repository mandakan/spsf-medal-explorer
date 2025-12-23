import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProfileSelector from './ProfileSelector'
import { useProfile } from '../hooks/useProfile'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/skill-tree', label: 'Märken' },
  { path: '/medals', label: 'Märkeslista' },
  { path: '/about', label: 'Om' },
  { path: '/settings', label: 'Inställningar' },
  { path: '/data', label: 'Data' }
]

export default function Header() {
  const location = useLocation()
  const [openedAtPath, setOpenedAtPath] = useState(null)
  const open = openedAtPath === location.pathname
  const { currentProfile } = useProfile()
  const [profilePickerOpen, setProfilePickerOpen] = useState(false)
  const profileInitials = currentProfile?.displayName
    ? currentProfile.displayName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : null

  // Derive "open" from the current route to avoid setState in effect

  // Allow closing with Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenedAtPath(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="bg-bg-secondary border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
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
              className="text-2xl font-bold leading-tight break-words text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              🎖️ Skyttemärken
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
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`inline-flex items-center min-h-[44px] px-4 py-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
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
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"></path>
                </svg>
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
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`inline-flex items-center min-h-[44px] px-4 py-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
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
