# Updated Roadmap: React + Tailwind v4 + Vite Stack

## Technology Stack

```
Frontend: React 18.3
Styling: Tailwind CSS v4
Build: Vite 5
Routing: React Router v6
Storage: localStorage (POC) → API backend (Phase 2+)
Testing: Jest + React Testing Library
Package Manager: npm
```

## Phase 1: Foundation (PRs 1-4) - 2-4 Weeks

### PR-001: Project Setup & Medal Database ⭐ START HERE
- Initialize Vite + React + Tailwind v4 project
- Create Medal, Profile, Achievement models
- Load complete SHB medal database from JSON
- Set up MedalContext for React
- Create custom hook: useMedalDatabase
- **Effort**: 2-3 days
- **Depends on**: Nothing

### PR-002: Data Layer & Storage System
- Implement DataManager abstract interface
- Create LocalStorageDataManager implementation
- Build ProfileContext for state management
- Create custom hooks: useProfile
- Create ProfileSelector component
- Implement import/export functionality
- **Effort**: 3-4 days
- **Depends on**: PR-001

### PR-003: Medal Achievement Calculator
- Implement MedalCalculator class
- Create InputValidator for data validation
- Build CalculatorContext
- Create custom hooks: useMedalCalculator, useMedalStatus, useAllMedalStatuses
- Integrate with React.useMemo for performance
- Real-time medal status updates
- **Effort**: 5-7 days
- **Depends on**: PR-001, PR-002

### PR-004: UI Shell with React Router
- Set up React Router v6 with 4 main routes
- Create RootLayout with header
- Build Home, SkillTree, MedalsList, Settings pages
- Create Header component with navigation
- Create MedalCard reusable component
- Create AchievementForm component
- Style all components with Tailwind
- Mobile-first responsive design
- **Effort**: 4-5 days
- **Depends on**: PR-001, PR-002, PR-003

**After Phase 1**: Working MVP with all core functionality, data persistence, medal calculation, and multi-view UI.

---

## Phase 2: Features (PRs 5-7) - 2-3 Weeks

### PR-005: Canvas Visualization
- Implement D3.js or Canvas-based skill-tree visualization
- Pan, zoom, and click interactions
- Real-time updates as medal status changes

### PR-006: Advanced Achievement Input
- Multi-medal batch input
- Achievement history/timeline view
- Undo/redo functionality

### PR-007: Filtering & Search
- Filter medals by type, tier, status
- Search functionality
- Advanced sorting options

---

## How React Improves This Project

### State Management
- ProfileContext manages current profile across entire app
- CalculatorContext memoizes medal calculations
- MedalContext provides medal database globally
- No prop drilling—components access context directly

### Component Reusability
- MedalCard used in multiple views
- AchievementForm integrated into Settings
- Header component reused across layouts

### Performance
- React.useMemo prevents unnecessary recalculations
- Custom hooks encapsulate logic
- Lazy loading ready for future implementation

### Developer Experience
- Hot Module Replacement (HMR) with Vite
- React DevTools browser extension
- Clear component hierarchy
- Easy to test components in isolation

---

## How Tailwind CSS Improves Styling

### Design System Integration
```tailwind.config.js
theme: {
  colors: {
    'medal-gold': '#FFD700',
    'medal-silver': '#C0C0C0',
    'medal-bronze': '#CD7F32',
    'primary': '#208491',  // From design docs
    'accent': '#32b8c6',
  }
}
```

### Mobile-First Responsive
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // Responsive at all breakpoints
</div>
```

### Utility-First Approach
- Quick prototyping
- Consistent spacing/sizing
- No custom CSS needed for most components
- Design system enforced through config

---

## Project Structure After Phase 1

```
medal-app/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── ProfileSelector.jsx
│   │   ├── MedalCard.jsx
│   │   └── AchievementForm.jsx
│   ├── contexts/
│   │   ├── MedalContext.jsx
│   │   ├── ProfileContext.jsx
│   │   └── CalculatorContext.jsx
│   ├── hooks/
│   │   ├── useMedalDatabase.js
│   │   ├── useProfile.js
│   │   ├── useMedalCalculator.js
│   │   └── useMedalStatus.js
│   ├── layouts/
│   │   └── RootLayout.jsx
│   ├── logic/
│   │   ├── calculator.js
│   │   └── validator.js
│   ├── models/
│   │   ├── Medal.js
│   │   ├── Profile.js
│   │   └── Achievement.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SkillTree.jsx
│   │   ├── MedalsList.jsx
│   │   └── Settings.jsx
│   ├── data/
│   │   ├── dataManager.js
│   │   ├── localStorage.js
│   │   └── medals.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── medals.test.js
│   ├── storage.test.js
│   ├── calculator.test.js
│   └── router.test.js
├── public/
│   └── index.html
├── vite.config.js
├── tailwind.config.js
├── jest.config.js
├── .babelrc
├── package.json
└── .gitignore
```

---

## Development Workflow

### Setup (First Time)
```bash
npm create vite@latest medal-app -- --template react
cd medal-app
npm install
npm install -D tailwindcss @tailwindcss/vite react-router-dom
npm run dev
```

### Development
```bash
# Start dev server with HMR
npm run dev

# Run tests in watch mode
npm test -- --watch

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git Workflow
```bash
# After each PR
git add .
git commit -m "PR-XXX: [Description]"
git push origin main
```

---

## Success Metrics by PR

| PR | Success | Verification |
|----|---------|--------------|
| **001** | Medal DB loads | `npm test tests/medals.test.js` ✓ |
| **002** | Profiles save/load | `npm test tests/storage.test.js` ✓ |
| **003** | Medal status correct | `npm test tests/calculator.test.js` ✓ |
| **004** | App renders & navigates | `npm run dev` → browser ✓ |

---

## Timeline Estimate

```
Week 1 (Mon-Fri)
├─ PR-001: Mon-Tue (setup, medals)
├─ PR-002: Wed-Thu (storage, profiles)
└─ Slack buffer: Fri

Week 2 (Mon-Fri)
├─ PR-003: Mon-Wed (calculator, hooks)
├─ PR-004: Thu-Fri (UI, routing)
└─ MVP complete! ✓

Week 3+ (Optional)
└─ Phase 2: Canvas, filters, etc.
```

---

## Common React + Tailwind Patterns

### Using Tailwind with React State
```jsx
const [isOpen, setIsOpen] = useState(false)

return (
  <button
    onClick={() => setIsOpen(!isOpen)}
    className={`px-4 py-2 rounded ${
      isOpen ? 'bg-primary text-white' : 'bg-gray-200'
    }`}
  >
    Toggle
  </button>
)
```

### Custom Hook with Tailwind
```jsx
export function useMedalCard(medalId) {
  const status = useMedalStatus(medalId)
  
  const colorClass = {
    'unlocked': 'bg-yellow-50',
    'achievable': 'bg-green-50',
    'locked': 'bg-gray-50'
  }[status?.status] || 'bg-gray-50'
  
  return { colorClass, status }
}
```

### Context with Tailwind Classes
```jsx
const { currentProfile } = useProfile()

return (
  <div className={`
    p-4 rounded-lg
    ${currentProfile 
      ? 'bg-green-50 border border-green-200' 
      : 'bg-blue-50 border border-blue-200'
    }
  `}>
    {currentProfile?.displayName || 'No profile'}
  </div>
)
```

---

## Debugging Tips

### React
- Use React DevTools browser extension
- Check component props in DevTools
- Use `console.log()` in render (React DevTools breaks sometimes)
- Check if context is properly nested

### Tailwind
- Check `tailwind.config.js` for custom colors
- Use `@apply` if repeating same classes
- Browser DevTools → Styles → Tailwind classes
- Run `npm run dev` to see changes

### Vite
- HMR should auto-update on save
- If not, check browser console for errors
- Clear `.vite` cache if stuck
- Full page reload only if imports are cyclic

---

## References During Development

**When stuck on...**
- **React patterns** → Check component in PR spec
- **Tailwind styling** → Check tailwind.config.js
- **Medal system** → See 07-Medal-Database-Reference.md
- **Data flow** → See 02-Data-Model.md
- **Architecture** → See 05-Technical-Architecture.md

---

## Quality Gates

### Before Committing PR
```bash
npm test          # All tests must pass
npm run build     # Build must succeed
npm run dev       # Dev server must start
```

### Code Review Checklist
- All tests passing
- No console errors/warnings
- Mobile responsive (test in DevTools)
- Keyboard navigation working
- Code follows patterns from design docs
- No hardcoded data

---

**Ready to code? Start with PR-001!** 🚀
