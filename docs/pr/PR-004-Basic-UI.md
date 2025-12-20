# PR-004: UI Shell with React Router & Components (React + Tailwind + Vite)

## DESCRIPTION
Build the foundational UI with React Router for SPA navigation, create all main view components (Home, Skill-Tree, List, Settings), and implement navigation header and profile selector UI using Tailwind CSS styling.

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System
- PR-003: Medal Achievement Calculator

## ACCEPTANCE CRITERIA
- [ ] React Router v6 configured for multi-view navigation
- [ ] All 4 main views implemented (Home, Skill-Tree, List, Settings)
- [ ] Header component with navigation links
- [ ] Profile selector UI functional
- [ ] Tailwind CSS styling applied to all components
- [ ] Mobile responsive design (mobile-first approach)
- [ ] Keyboard navigation working throughout
- [ ] All providers (Medal, Profile, Calculator) properly nested
- [ ] Views integrate with contexts to display dynamic data
- [ ] App starts with `npm run dev` and navigates without page reloads

## FILES TO CREATE
- package.json (add react-router-dom)
- src/App.jsx (updated with Router)
- src/layouts/RootLayout.jsx (main layout with header)
- src/pages/Home.jsx (welcome/home page)
- src/pages/SkillTree.jsx (skill-tree view scaffold)
- src/pages/MedalsList.jsx (medal list view)
- src/pages/Settings.jsx (settings/achievements page)
- src/components/Header.jsx (navigation header)
- src/components/MedalCard.jsx (reusable medal card)
- src/components/AchievementForm.jsx (achievement input form)
- tests/router.test.js (routing tests)

## CODE STRUCTURE

### package.json (update dependencies)

Add to existing package.json:
```json
{
  "dependencies": {
    "react-router-dom": "^6.22.0"
  }
}
```

### src/App.jsx

```jsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MedalProvider } from './contexts/MedalContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { CalculatorProvider } from './contexts/CalculatorContext'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import SkillTree from './pages/SkillTree'
import MedalsList from './pages/MedalsList'
import Settings from './pages/Settings'

function App() {
  return (
    <MedalProvider>
      <ProfileProvider>
        <CalculatorProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/skill-tree" element={<SkillTree />} />
                <Route path="/medals" element={<MedalsList />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CalculatorProvider>
      </ProfileProvider>
    </MedalProvider>
  )
}

export default App
```

### src/layouts/RootLayout.jsx

```jsx
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
        
        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### src/components/Header.jsx

```jsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/skill-tree', label: 'Skill Tree' },
  { path: '/medals', label: 'Medals' },
  { path: '/settings', label: 'Settings' }
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="bg-bg-secondary border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            🎖️ Medal Skill-Tree
          </Link>
          
          <nav>
            <ul className="flex gap-4">
              {navItems.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

### src/pages/Home.jsx

```jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useMedalDatabase } from '../hooks/useMedalDatabase'

export default function Home() {
  const { medalDatabase, loading } = useMedalDatabase()

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Medal Skill-Tree Explorer
        </h1>
        <p className="text-lg text-text-secondary">
          Track your SHB medal achievements and plan your progression
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/skill-tree"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">🎯 Skill Tree</h3>
          <p className="text-text-secondary">
            Explore medals in an interactive tree view
          </p>
        </Link>

        <Link
          to="/medals"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">📊 Medal List</h3>
          <p className="text-text-secondary">
            Browse all medals with filters and search
          </p>
        </Link>

        <Link
          to="/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">📝 Settings</h3>
          <p className="text-text-secondary">
            Log achievements and manage your profile
          </p>
        </Link>
      </section>

      {!loading && medalDatabase && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-text-secondary">
            ✓ {medalDatabase.getAllMedals().length} medals loaded
          </p>
        </section>
      )}
    </div>
  )
}
```

### src/pages/SkillTree.jsx

```jsx
import React from 'react'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'

export default function SkillTree() {
  const statuses = useAllMedalStatuses()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Skill Tree</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800">Unlocked</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {statuses.unlocked.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-bold text-green-800">Achievable</h3>
          <p className="text-2xl font-bold text-green-600">
            {statuses.achievable.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800">Locked</h3>
          <p className="text-2xl font-bold text-gray-600">
            {statuses.locked.length}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Canvas visualization coming in Phase 2. For now, use the Medals list view.
        </p>
      </div>
    </div>
  )
}
```

### src/pages/MedalsList.jsx

```jsx
import React, { useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import MedalCard from '../components/MedalCard'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const [filter, setFilter] = useState('all')

  if (!medalDatabase) {
    return <div>Loading...</div>
  }

  let filteredMedals = medalDatabase.getAllMedals()

  if (filter !== 'all') {
    filteredMedals = filteredMedals.filter(m => {
      const status = statuses[filter]?.find(s => s.medalId === m.id)
      return !!status
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Medals</h1>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="all">All</option>
          <option value="unlocked">Unlocked</option>
          <option value="achievable">Achievable</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedals.map(medal => (
          <MedalCard key={medal.id} medal={medal} />
        ))}
      </div>
    </div>
  )
}
```

### src/pages/Settings.jsx

```jsx
import React from 'react'
import { useProfile } from '../hooks/useProfile'
import AchievementForm from '../components/AchievementForm'

export default function Settings() {
  const { currentProfile } = useProfile()

  if (!currentProfile) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700">Please select or create a profile first</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Name</label>
                <p className="text-lg font-semibold text-text-primary">
                  {currentProfile.displayName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Weapon Group
                </label>
                <p className="text-lg font-semibold text-text-primary">
                  {currentProfile.weaponGroupPreference}
                </p>
              </div>
            </div>
          </div>

          <AchievementForm />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Data</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              📥 Export Data
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              📤 Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### src/components/MedalCard.jsx

```jsx
import React from 'react'
import { useMedalStatus } from '../hooks/useMedalCalculator'

export default function MedalCard({ medal }) {
  const status = useMedalStatus(medal.id)

  const statusColors = {
    unlocked: 'bg-yellow-50 border-yellow-200',
    achievable: 'bg-green-50 border-green-200',
    locked: 'bg-gray-50 border-gray-200'
  }

  const statusBadge = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }

  const statusClass = status?.status || 'locked'

  return (
    <div
      className={`rounded-lg border p-4 ${statusColors[statusClass]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-text-primary">{medal.displayName}</h3>
        <span className="text-sm font-semibold">
          {statusBadge[statusClass]}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {medal.type} • {medal.tier}
      </p>

      {medal.description && (
        <p className="text-sm mb-3">{medal.description}</p>
      )}

      {status && status.details && (
        <div className="text-xs text-text-secondary">
          {status.details.items?.length > 0 && (
            <p>Requirements: {status.details.items.length}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### src/components/AchievementForm.jsx

```jsx
import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { Achievement } from '../models/Achievement'
import { InputValidator } from '../logic/validator'

export default function AchievementForm() {
  const { addAchievement, loading } = useProfile()
  const [formData, setFormData] = useState({
    type: 'gold_series',
    year: new Date().getFullYear(),
    weaponGroup: 'A',
    points: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    const validation = InputValidator.validateGoldSeriesInput(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    try {
      const achievement = new Achievement({
        ...formData,
        points: parseInt(formData.points)
      })
      await addAchievement(achievement)
      setFormData({
        ...formData,
        points: ''
      })
      setErrors([])
    } catch (err) {
      setErrors([err.message])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Add Achievement</h2>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          {errors.map((err, i) => (
            <p key={i} className="text-red-700 text-sm">{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            disabled={loading}
          >
            <option value="gold_series">Gold Series</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Group</label>
            <select
              value={formData.weaponGroup}
              onChange={(e) => setFormData({ ...formData, weaponGroup: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={loading}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Points</label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="0-50"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Achievement'}
        </button>
      </form>
    </div>
  )
}
```

## DESIGN DOCUMENT REFERENCES
- **03-Interaction-Design.md** - Views section
- **04-Visual-Design.md** - Tailwind design system
- **05-Technical-Architecture.md** - UI Layer and component structure

## DONE WHEN
- React Router navigation working without page reloads
- All 4 views render correctly
- Header shows current view indicator
- Profile selector visible on all pages
- Tailwind CSS styling applied throughout
- Mobile responsive on phones, tablets, and desktop
- Keyboard navigation working
- All tests pass
- App ready for Phase 2 features
