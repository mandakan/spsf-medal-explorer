# PR-001: Project Setup & Medal Database (React + Tailwind + Vite)

## DESCRIPTION
Initialize the project structure with React, Vite, and Tailwind CSS v4, then load the complete SHB medal database and create the foundational data models. This establishes the single source of truth for all medal information and provides the base for subsequent PRs.

## DEPENDENCIES
- None (first PR in Phase 1)

## ACCEPTANCE CRITERIA
- [ ] Vite + React + Tailwind v4 project initialized successfully
- [ ] All 10+ SHB medal types loaded from medals.json
- [ ] Medal objects conform to schema in 02-Data-Model.md (Medal Object section)
- [ ] All prerequisite relationships correctly encoded
- [ ] All weapon group point thresholds match 07-Medal-Database-Reference.md
- [ ] Time-window requirements properly documented in each medal
- [ ] React hooks and context set up for future state management
- [ ] Unit tests verify medal data structure and relationships
- [ ] No hardcoded medal data in components
- [ ] App starts with `npm run dev` without errors

## FILES TO CREATE
- package.json (Vite + React + Tailwind config)
- src/main.jsx (React entry point)
- src/App.jsx (Root component)
- src/index.css (Tailwind directives)
- src/data/medals.json (complete medal database)
- src/models/Medal.js (Medal class)
- src/models/Profile.js (Profile class)
- src/models/Achievement.js (Achievement class)
- src/contexts/MedalContext.jsx (React context for medals)
- src/hooks/useMedalDatabase.js (custom hook to load medals)
- vite.config.js (Vite configuration)
- tailwind.config.js (Tailwind v4 configuration)
- .gitignore
- tests/medals.test.js (medal database tests)
- tests/setup.js (Jest setup for React)

## CODE STRUCTURE

### package.json

```json
{
  "name": "medal-skill-tree-explorer",
  "version": "0.1.0",
  "type": "module",
  "description": "Interactive skill-tree explorer for SHB medal achievements",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^16.0.0",
    "babel-jest": "^29.7.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "tailwindcss": "^4.0.0",
    "vite": "^5.1.0"
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SHB Medal colors
        'medal-gold': '#FFD700',
        'medal-silver': '#C0C0C0',
        'medal-bronze': '#CD7F32',
        // App colors per 04-Visual-Design.md
        'primary': '#208491',
        'primary-hover': '#1d745f',
        'accent': '#32b8c6',
        'bg-primary': '#fcfcf9',
        'bg-secondary': '#ffffff',
        'text-primary': '#133452',
        'text-secondary': '#626c71',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
}
```

### src/index.css

```css
@import "tailwindcss";

/* Optional: Override Tailwind defaults with design system tokens */
:root {
  --color-primary: #208491;
  --color-primary-hover: #1d745f;
  --color-accent: #32b8c6;
  --color-medal-gold: #FFD700;
  --color-medal-silver: #C0C0C0;
  --color-medal-bronze: #CD7F32;
}

html {
  @apply bg-bg-primary text-text-primary;
}

body {
  @apply m-0 p-0;
}

/* Smooth transitions */
* {
  @apply transition-colors duration-200;
}
```

### src/main.jsx

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### src/App.jsx

```jsx
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
```

### src/models/Medal.js

```javascript
/**
 * Represents a single medal in the SHB system
 */
export class Medal {
  constructor(data) {
    this.id = data.id
    this.type = data.type
    this.tier = data.tier
    this.name = data.name
    this.displayName = data.displayName
    this.color = data.color
    this.icon = data.icon
    this.prerequisites = data.prerequisites || []
    this.requirements = data.requirements || []
    this.unlocksFollowingMedals = data.unlocksFollowingMedals || []
    this.description = data.description || ''
    this.yearIntroduced = data.yearIntroduced
    this.sortOrder = data.sortOrder
  }

  /**
   * Get human-readable display name with tier
   */
  getFullName() {
    return `${this.displayName} (${this.tier.charAt(0).toUpperCase() + this.tier.slice(1)})`
  }

  /**
   * Get color for UI display
   */
  getColorClass() {
    if (this.color === '#FFD700') return 'text-yellow-500'
    if (this.color === '#C0C0C0') return 'text-gray-400'
    if (this.color === '#CD7F32') return 'text-orange-700'
    return 'text-gray-500'
  }
}

/**
 * Medal database manager
 */
export class MedalDatabase {
  constructor(medalDataJson) {
    this.medals = medalDataJson.medals.map(m => new Medal(m))
  }

  getMedalById(medalId) {
    return this.medals.find(m => m.id === medalId)
  }

  getMedalsByType(type) {
    return this.medals.filter(m => m.type === type)
  }

  getMedalsByTier(tier) {
    return this.medals.filter(m => m.tier === tier)
  }

  getAllMedals() {
    return [...this.medals]
  }
}
```

### src/models/Profile.js

```javascript
/**
 * Represents a user's profile and achievements
 */
export class UserProfile {
  constructor(data) {
    this.userId = data.userId || `user-${Date.now()}`
    this.displayName = data.displayName
    this.createdDate = data.createdDate || new Date().toISOString()
    this.lastModified = data.lastModified || new Date().toISOString()
    this.weaponGroupPreference = data.weaponGroupPreference || 'A'
    this.unlockedMedals = data.unlockedMedals || []
    this.prerequisites = data.prerequisites || []
  }

  /**
   * Update modification timestamp
   */
  touch() {
    this.lastModified = new Date().toISOString()
  }
}
```

### src/models/Achievement.js

```javascript
/**
 * Represents a single achievement (gold series, competition result, etc.)
 */
export class Achievement {
  constructor(data) {
    this.id = data.id || `achievement-${Date.now()}`
    this.type = data.type // 'gold_series', 'competition_result', etc.
    this.year = data.year
    this.weaponGroup = data.weaponGroup
    this.points = data.points
    this.date = data.date
    this.competitionName = data.competitionName || ''
    this.notes = data.notes || ''
  }
}
```

### src/contexts/MedalContext.jsx

```jsx
import React, { createContext, useState, useEffect } from 'react'
import { MedalDatabase } from '../models/Medal'
import medalsData from '../data/medals.json'

/**
 * React context for medal database
 * Provides medal data to all components
 */
export const MedalContext = createContext(null)

export function MedalProvider({ children }) {
  const [medalDatabase, setMedalDatabase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Initialize medal database on mount
    try {
      const db = new MedalDatabase(medalsData)
      setMedalDatabase(db)
      setError(null)
    } catch (err) {
      setError(`Failed to load medal database: ${err.message}`)
      console.error('Medal database error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <MedalContext.Provider value={{ medalDatabase, loading, error }}>
      {children}
    </MedalContext.Provider>
  )
}
```

### src/hooks/useMedalDatabase.js

```javascript
import { useContext } from 'react'
import { MedalContext } from '../contexts/MedalContext'

/**
 * Custom hook to access medal database
 * Usage: const { medalDatabase, loading, error } = useMedalDatabase()
 */
export function useMedalDatabase() {
  const context = useContext(MedalContext)
  
  if (!context) {
    throw new Error('useMedalDatabase must be used within MedalProvider')
  }
  
  return context
}
```

### src/pages/Home.jsx

```jsx
import React from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'

export default function Home() {
  const { medalDatabase, loading, error } = useMedalDatabase()

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Loading medal database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  const medalCount = medalDatabase?.medals.length || 0

  return (
    <div>
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-4 text-text-primary">
          Welcome to Medal Skill-Tree Explorer
        </h2>
        <p className="text-lg text-text-secondary">
          Track your SHB medal achievements and plan your progression
        </p>
      </section>

      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-text-primary">
          Database Status
        </h3>
        <p className="text-text-secondary">
          ✓ {medalCount} medals loaded successfully
        </p>
        <p className="text-text-secondary text-sm mt-2">
          Ready to explore the skill-tree!
        </p>
      </section>
    </div>
  )
}
```

### src/data/medals.json

Structure per 02-Data-Model.md:
```json
{
  "version": "1.0",
  "medals": [
    {
      "id": "pistol-mark-bronze",
      "type": "pistol_mark",
      "tier": "bronze",
      "name": "Pistolskyttemärket - Brons",
      "displayName": "Pistol Mark - Bronze",
      "color": "#CD7F32",
      "icon": "medal-bronze",
      
      "prerequisites": [],
      
      "requirements": [
        {
          "type": "gold_series",
          "description": "3 precision series",
          "minAchievements": 3,
          "timeWindowYears": 1,
          "pointThresholds": {
            "A": { "min": 32 },
            "B": { "min": 33 },
            "C": { "min": 34 }
          }
        }
      ],
      
      "unlocksFollowingMedals": [
        "pistol-mark-silver",
        "elite-mark-bronze",
        "field-mark-bronze"
      ],
      
      "yearIntroduced": 2000,
      "sortOrder": 1
    }
  ]
}
```

Complete list from 07-Medal-Database-Reference.md:
- Pistolskyttemärket (Pistol Mark) - all tiers and stars
- Elitmärket (Elite Mark) - all tiers
- Fältskyttemärket (Field Mark) - all tiers
- Mästarmerket (Championship Mark) - all tiers
- Precisionsskyttemärket (Precision Mark) - all tiers
- Skidskyttemärket (Skis Mark) - all tiers
- Springskyttemärket (Spring Running Mark) - all tiers
- Märke i Nationell Helmatch (National Full Match Mark) - all tiers

### tests/medals.test.js

```javascript
import { Medal, MedalDatabase } from '../src/models/Medal'
import medalsData from '../src/data/medals.json'

describe('Medal Database', () => {
  let medalDb

  beforeEach(() => {
    medalDb = new MedalDatabase(medalsData)
  })

  test('loads all medals successfully', () => {
    expect(medalDb.medals.length).toBeGreaterThan(10)
  })

  test('finds medal by id', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal).toBeDefined()
    expect(medal.displayName).toBe('Pistol Mark - Bronze')
  })

  test('bronze pistol mark has no prerequisites', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal.prerequisites.length).toBe(0)
  })

  test('silver pistol mark requires bronze', () => {
    const medal = medalDb.getMedalById('pistol-mark-silver')
    expect(medal.prerequisites.some(p => p.medalId === 'pistol-mark-bronze')).toBe(true)
  })

  test('gold series requirement has correct point thresholds', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    const goldSeriesReq = medal.requirements.find(r => r.type === 'gold_series')
    expect(goldSeriesReq.pointThresholds.A.min).toBe(32)
    expect(goldSeriesReq.pointThresholds.B.min).toBe(33)
    expect(goldSeriesReq.pointThresholds.C.min).toBe(34)
  })

  test('medals unlock following medals correctly', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal.unlocksFollowingMedals).toContain('pistol-mark-silver')
    expect(medal.unlocksFollowingMedals).toContain('elite-mark-bronze')
  })

  test('gets medals by type', () => {
    const pistolMarks = medalDb.getMedalsByType('pistol_mark')
    expect(pistolMarks.length).toBeGreaterThan(0)
    expect(pistolMarks.every(m => m.type === 'pistol_mark')).toBe(true)
  })

  test('gets medals by tier', () => {
    const bronzeMarks = medalDb.getMedalsByTier('bronze')
    expect(bronzeMarks.length).toBeGreaterThan(0)
    expect(bronzeMarks.every(m => m.tier === 'bronze')).toBe(true)
  })
})

describe('Medal Class', () => {
  test('creates medal with all properties', () => {
    const medal = new Medal({
      id: 'test-medal',
      type: 'pistol_mark',
      tier: 'bronze',
      displayName: 'Test Medal',
      color: '#FFD700',
      prerequisites: [],
      requirements: []
    })
    expect(medal.id).toBe('test-medal')
    expect(medal.type).toBe('pistol_mark')
  })

  test('getFullName returns tier name', () => {
    const medal = new Medal({
      id: 'test',
      displayName: 'Test Medal',
      tier: 'bronze'
    })
    expect(medal.getFullName()).toBe('Test Medal (Bronze)')
  })
})
```

### jest.config.js

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/tests/**/*.test.js'],
}
```

### .babelrc

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

### .gitignore

```
# Dependencies
node_modules
npm-debug.log
yarn-error.log

# Build
dist
build

# Environment
.env
.env.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage
.nyc_output
```

## PROJECT SETUP STEPS

1. **Initialize React project with Vite:**
   ```bash
   npm create vite@latest medal-app -- --template react
   cd medal-app
   ```

2. **Install Tailwind CSS v4:**
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```

3. **Install testing dependencies:**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom jest babel-jest @babel/preset-env @babel/preset-react jest-environment-jsdom identity-obj-proxy
   ```

4. **Create project structure:**
   ```bash
   mkdir -p src/{models,contexts,hooks,pages,data,components}
   mkdir tests
   ```

5. **Create all files per FILES TO CREATE section**

6. **Run development server:**
   ```bash
   npm run dev
   ```

7. **Run tests:**
   ```bash
   npm test
   ```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Medal Object structure and relationships
- **07-Medal-Database-Reference.md** - All SHB medal specifications and data mapping
- **04-Visual-Design.md** - Tailwind theme customization

## DATA INTEGRITY CHECKS

Medal data must pass validation:

- [ ] All medal IDs are unique
- [ ] All medal types match known types (pistol_mark, elite_mark, field_mark, etc.)
- [ ] All tiers are valid (bronze, silver, gold, star_1, star_2, star_3)
- [ ] All prerequisite medalIds reference existing medals
- [ ] All unlocksFollowingMedals reference existing medals
- [ ] Point thresholds: A ≤ B ≤ C (lower requirement for easier group)
- [ ] Time windows are positive numbers
- [ ] No circular dependencies in prerequisites

## DONE WHEN
- Vite dev server starts without errors
- Medal database loads and all tests pass
- All files created with correct structure
- No console errors or warnings
- React components render correctly
- Tailwind CSS is applied correctly
- Ready for PR-002

## NOTES
- The medal database is the single source of truth; no hardcoding elsewhere
- React context provides medals to all components
- Custom hook (useMedalDatabase) for easy access throughout app
- Tailwind v4 uses new CSS-first approach (no tailwind.config.js required but helpful for custom colors)
- Future PRs will add state management, routing, and more components
