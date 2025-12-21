import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MedalProvider } from './contexts/MedalContext.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'
import { CalculatorProvider } from './contexts/CalculatorContext.jsx'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import SkillTree from './pages/SkillTree'
import MedalsList from './pages/MedalsList'
import Settings from './pages/Settings'
import DataBackup from './pages/DataBackup'

function App() {
  return (
    <MedalProvider>
      <ProfileProvider>
        <CalculatorProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<RootLayout />}>
                <Route index element={<Home />} />
                <Route path="skill-tree" element={<SkillTree />} />
                <Route path="medals" element={<MedalsList />} />
                <Route path="settings" element={<Settings />} />
                <Route path="data" element={<DataBackup />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CalculatorProvider>
      </ProfileProvider>
    </MedalProvider>
  )
}

export default App
