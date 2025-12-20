import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import ProfileSelector from '../components/ProfileSelector'

export default function RootLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileSelector />
        
        <main id="main" className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
