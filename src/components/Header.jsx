import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/skill-tree', label: 'Skill Tree' },
  { path: '/medals', label: 'Medals' },
  { path: '/settings', label: 'Settings' }
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="bg-bg-secondary border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            🎖️ Medal Skill-Tree
          </Link>
          
          <nav aria-label="Primary">
            <ul className="flex gap-2">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`px-4 py-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
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
