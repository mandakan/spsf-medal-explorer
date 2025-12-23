import React from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MedalProvider } from './contexts/MedalContext.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'
import { CalculatorProvider } from './contexts/CalculatorContext.jsx'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import SkillTree from './pages/SkillTree'
import MedalsList from './pages/MedalsList'
import Settings from './pages/Settings'
import DataBackup from './pages/DataBackup'
import About from './pages/About'
import MedalDetailModal from './components/MedalDetailModal'

function MedalDetailOverlay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const background = location.state?.backgroundLocation
  const handleClose = () => {
    if (background && background.pathname) {
      const to = `${background.pathname}${background.search || ''}${background.hash || ''}`
      navigate(to, { replace: true })
    } else {
      navigate(-1)
    }
  }
  return <MedalDetailModal medalId={id} onClose={handleClose} />
}

function AppRoutes() {
  const location = useLocation()
  const background = location.state?.backgroundLocation
  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="skill-tree" element={<SkillTree />} />
          <Route path="medals" element={<MedalsList />} />
          <Route path="medals/:id" element={<MedalsList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="data" element={<DataBackup />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
      {background && (
        <Routes>
          <Route path="/medals/:id" element={<MedalDetailOverlay />} />
        </Routes>
      )}
    </>
  )
}

function App() {
  const base = (typeof document !== 'undefined' && document.querySelector('base')?.getAttribute('href')) || '/'
  return (
    <MedalProvider>
      <ProfileProvider>
        <CalculatorProvider>
          <BrowserRouter basename={base}>
            <AppRoutes />
          </BrowserRouter>
        </CalculatorProvider>
      </ProfileProvider>
    </MedalProvider>
  )
}

export default App
