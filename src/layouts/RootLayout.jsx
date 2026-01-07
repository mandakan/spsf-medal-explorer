import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackupReminder from '../components/BackupReminder'

export default function RootLayout() {

  return (
    <div className="min-h-screen bg-bg-primary">
      <BackupReminder />
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
