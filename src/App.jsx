import React from 'react'
import { MedalProvider } from './contexts/MedalContext'
import Home from './pages/Home'

function App() {
  return (
    <MedalProvider>
      <div className="min-h-screen bg-bg-primary">
        <header className="bg-bg-secondary border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-text-primary">
              🎖️ Medal Skill-Tree Explorer
            </h1>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Home />
        </main>
      </div>
    </MedalProvider>
  )
}

export default App
