import React, { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MedalProvider } from './contexts/MedalContext.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'
import { CalculatorProvider } from './contexts/CalculatorContext.jsx'
import { UndoRedoProvider } from './contexts/UndoRedoContext.jsx'
import { FeatureFlagsProvider } from './contexts/FeatureFlags.jsx'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import SkillTree from './pages/SkillTree'
import MedalsList from './pages/MedalsList'
import Settings from './pages/Settings'
import DataBackup from './pages/DataBackup'
import About from './pages/About'
import MedalDetailModal from './components/MedalDetailModal'
import RequireSavedProfile from './components/RequireSavedProfile'
import WhatsNewOverlay from './components/WhatsNewOverlay'
import { getBuildId, getLastSeen, isProductionEnv } from './utils/whatsNew'


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
  const navigate = useNavigate()
  const background = location.state?.backgroundLocation
  const isMedalDetail = location.pathname.startsWith('/medals/')
  const isWhatsNew = location.pathname === '/whats-new'
  const isOverlayRoute = (isMedalDetail || isWhatsNew)
  const renderLocation = (isOverlayRoute && background) ? background : location

  // One-time boot: show "What's New" after version bump (production only)
  const bootedRef = useRef(false)
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    if (!isProductionEnv()) return
    const buildId = getBuildId()
    const last = getLastSeen()
    if (!buildId || last === buildId) return
    const timer = setTimeout(() => {
      const state = { backgroundLocation: location }
      navigate('/whats-new', { replace: true, state })
    }, 700)
    return () => clearTimeout(timer)
  }, [location, navigate])

  return (
    <>
      <Routes location={renderLocation}>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="skill-tree" element={<SkillTree />} />
          <Route path="skill-tree/fullscreen" element={<SkillTree />} />
          <Route path="medals" element={<MedalsList />} />
          <Route path="medals/:id" element={<MedalsList />} />
          <Route
            path="settings"
            element={
              <RequireSavedProfile>
                <Settings />
              </RequireSavedProfile>
            }
          />
          <Route
            path="data"
            element={
              <RequireSavedProfile>
                <DataBackup />
              </RequireSavedProfile>
            }
          />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
      {isMedalDetail && background && (
        <Routes>
          <Route path="/medals/:id" element={<MedalDetailOverlay />} />
        </Routes>
      )}
      <Routes>
        <Route path="/whats-new" element={<WhatsNewOverlay />} />
      </Routes>
    </>
  )
}

function App() {
  const base = (typeof document !== 'undefined' && document.querySelector('base')?.getAttribute('href')) || '/'
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (isDark) => {
      document.documentElement.classList.toggle('dark', isDark)
    }
    apply(mq.matches)
    const onChange = (e) => apply(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return (
    <MedalProvider>
      <ProfileProvider>
        <FeatureFlagsProvider>
          <CalculatorProvider>
            <UndoRedoProvider>
              <BrowserRouter basename={base}>
                <AppRoutes />
              </BrowserRouter>
            </UndoRedoProvider>
          </CalculatorProvider>
        </FeatureFlagsProvider>
      </ProfileProvider>
    </MedalProvider>
  )
}

export default App
