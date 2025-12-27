import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MedalProvider } from './contexts/MedalContext.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'
import { CalculatorProvider } from './contexts/CalculatorContext.jsx'
import { UndoRedoProvider } from './contexts/UndoRedoContext.jsx'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import SkillTree from './pages/SkillTree'
import MedalsList from './pages/MedalsList'
import Settings from './pages/Settings'
import DataBackup from './pages/DataBackup'
import About from './pages/About'
import MedalDetailModal from './components/MedalDetailModal'
import { useProfile } from './hooks/useProfile'
import ProfileSelector from './components/ProfileSelector'

function RequireSavedProfile({ children }) {
  const { currentProfile } = useProfile()
  const navigate = useNavigate()
  const [showProfileSheet, setShowProfileSheet] = React.useState(false)
  const [sheetForceCreate, setSheetForceCreate] = React.useState(true)

  if (currentProfile && !currentProfile.isGuest) {
    return children
  }

  return (
    <div className="p-6">
      <div className="card p-6 w-full max-w-xl mx-auto" role="region" aria-labelledby="profile-required-heading">
        <h2 id="profile-required-heading" className="section-title mb-2">Profil krävs för att fortsätta</h2>
        <div className="text-sm text-muted-foreground space-y-3 mb-4">
          <p>För att använda Inställningar och import/export behöver du en sparad profil.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Spara dina framsteg och säkerhetskopiera data</li>
            <li>Hantera inställningar per profil</li>
            <li>Exportera och importera mellan enheter</li>
          </ul>
          {currentProfile?.isGuest && (
            <p>Du kan spara ditt nuvarande Gästläge som en profil och fortsätta utan att förlora något.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary min-h-[44px]"
            autoFocus
            onClick={() => {
              setSheetForceCreate(true)
              setShowProfileSheet(true)
            }}
            aria-haspopup="dialog"
            aria-controls="save-progress-picker-guard"
          >
            Skapa profil
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-[44px]"
            onClick={() => {
              setSheetForceCreate(false)
              setShowProfileSheet(true)
            }}
            aria-haspopup="dialog"
            aria-controls="save-progress-picker-guard"
          >
            Välj profil
          </button>
          <button
            type="button"
            className="btn btn-secondary min-h-[44px]"
            onClick={() => navigate('/medals')}
          >
            Tillbaka till märken
          </button>
        </div>
      </div>

      <ProfileSelector
        id="save-progress-picker-guard"
        mode="picker"
        open={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        forceCreate={sheetForceCreate}
        convertGuest
      />
    </div>
  )
}

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
        <CalculatorProvider>
          <UndoRedoProvider>
            <BrowserRouter basename={base}>
              <AppRoutes />
            </BrowserRouter>
          </UndoRedoProvider>
        </CalculatorProvider>
      </ProfileProvider>
    </MedalProvider>
  )
}

export default App
