import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function RootLayout() {

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <main id="main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
