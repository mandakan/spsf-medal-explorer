import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/skill-tree', label: 'Skill Tree' },
  { path: '/medals', label: 'Medals' },
  { path: '/settings', label: 'Settings' },
  { path: '/data', label: 'Data' }
]

export default function Header() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Close the mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Allow closing with Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="bg-bg-secondary border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Accessible skip link */}
          <a
            href="#main"
            className="absolute -top-10 left-2 focus:top-2 focus:left-2 focus:z-[60] btn btn-primary"
          >
            Skip to content
          </a>

          <Link
            to="/"
            className="text-2xl font-bold leading-tight break-words text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            🎖️ Medal Skill-Tree
          </Link>
          
          <nav aria-label="Primary" className="min-w-0 w-full sm:w-auto">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="sm:hidden btn btn-muted min-h-[44px] self-end"
              aria-label="Toggle main menu"
              aria-controls="primary-nav"
              aria-expanded={open ? 'true' : 'false'}
            >
              {open ? 'Close' : 'Menu'}
            </button>

            {/* Collapsible nav list */}
            <ul
              id="primary-nav"
              className={`${open ? 'grid grid-cols-2 gap-2 mt-2' : 'hidden'} sm:mt-0 sm:flex sm:gap-2`}
            >
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
    </header>
  )
}
