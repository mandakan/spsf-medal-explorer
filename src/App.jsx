import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
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
