import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import ProfileSelector from '../components/ProfileSelector'
import Footer from '../components/Footer'
import { useProfile } from '../hooks/useProfile'

export default function RootLayout() {
  const { currentProfile } = useProfile()
  const [profileOpen, setProfileOpen] = useState(false)

  // Default open on >= sm breakpoint (≥640px); collapsed on smaller screens.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 640px)')
    setProfileOpen(mq.matches)
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <details className="mb-4" open={profileOpen} onToggle={(e) => setProfileOpen(e.currentTarget.open)}>
          <summary
            className="w-full list-none cursor-pointer px-3 py-2 rounded-md bg-bg-secondary border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary min-h-[44px]"
          >
            Profile: {currentProfile?.displayName || '—'}
          </summary>
          <div className="mt-3">
            <ProfileSelector />
          </div>
        </details>
        
        <main id="main" className="mt-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
