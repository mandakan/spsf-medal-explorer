# Medal Skill-Tree Explorer App
## Technical Architecture & Implementation Guide

---

## Technology Stack

### Frontend
- **Framework**: Vanilla JavaScript (ES6+) - no dependencies in POC
- **Visualization**: Canvas API or SVG for skill-tree rendering
- **Storage**: LocalStorage API with JSON serialization
- **Build**: Minimal (single HTML file or light bundler)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) from 2020+

### Optional Libraries (Consider for Production)
- **Visualization**: D3.js or Three.js for advanced graph rendering
- **State Management**: Redux or Zustand for complex state
- **Testing**: Jest for unit tests, Cypress for E2E tests
- **Build**: Webpack or Vite for bundling

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    UI LAYER                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Views: Home, SkillTree, List, DetailModal        │   │
│  │ Components: Card, Button, Form, Canvas           │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                 APPLICATION LOGIC LAYER                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Controllers: MedalController, AchievementCtrl    │   │
│  │ Calculators: MedalCalculator, ProgressTracker   │   │
│  │ Validators: InputValidator, RuleValidator        │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                   DATA LAYER                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DataManager (interface)                          │   │
│  │  ├─ LocalStorageImpl (POC)                       │   │
│  │  └─ ApiImpl (future backend)                      │   │
│  │                                                  │   │
│  │ Models:                                          │   │
│  │  ├─ Medal Database                              │   │
│  │  ├─ User Profile                                │   │
│  │  └─ Achievement History                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Module Structure

### Directory Layout

```
medal-app/
├── index.html                 # Single-page app entry
├── css/
│   ├── style.css             # Main stylesheet
│   ├── components.css        # Component styles
│   └── responsive.css        # Mobile/responsive
├── js/
│   ├── main.js               # App initialization
│   ├── app.js                # Main app controller
│   │
│   ├── data/
│   │   ├── medals-db.js      # Medal database (JSON)
│   │   ├── data-manager.js   # Data layer interface
│   │   ├── storage.js        # LocalStorage implementation
│   │   └── models.js         # Data model classes
│   │
│   ├── logic/
│   │   ├── calculator.js     # Medal achievement calculator
│   │   ├── validator.js      # Input/rule validation
│   │   ├── progression.js    # Progression logic
│   │   └── exporter.js       # Import/export functionality
│   │
│   ├── ui/
│   │   ├── views/
│   │   │   ├── home.js       # Home screen
│   │   │   ├── skill-tree.js # Canvas skill tree
│   │   │   ├── list-view.js  # Medal list
│   │   │   ├── detail.js     # Medal detail modal
│   │   │   └── settings.js   # Settings page
│   │   │
│   │   ├── components/
│   │   │   ├── medal-node.js # Single medal node
│   │   │   ├── canvas.js     # Canvas renderer
│   │   │   ├── form.js       # Achievement input form
│   │   │   └── ...
│   │   │
│   │   └── router.js         # Simple view router
│   │
│   └── utils/
│       ├── logger.js         # Logging utility
│       ├── event-bus.js      # Event communication
│       └── helpers.js        # Helper functions
│
├── data/
│   └── medals.json           # Master medal data
│
└── tests/
    ├── calculator.test.js
    ├── validator.test.js
    └── integration.test.js
```

---

## Core Modules

### 1. Data Manager (Interface & Implementation)

**Purpose**: Abstract data storage (localStorage initially, API later)

```javascript
// data/data-manager.js
class DataManager {
  // Abstract interface
  async getUserProfile(userId) { throw new Error('Not implemented'); }
  async getMedalDatabase() { throw new Error('Not implemented'); }
  async saveUserProfile(profile) { throw new Error('Not implemented'); }
  async addAchievement(userId, achievement) { throw new Error('Not implemented'); }
  async removeAchievement(userId, achievementId) { throw new Error('Not implemented'); }
  async getAchievements(userId) { throw new Error('Not implemented'); }
  async exportData(userId) { throw new Error('Not implemented'); }
  async importData(jsonData) { throw new Error('Not implemented'); }
}

// data/storage.js
class LocalStorageDataManager extends DataManager {
  constructor() {
    super();
    this.storageKey = 'medal-app-data';
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        version: '1.0',
        profiles: [],
        medals: [],
        lastBackup: new Date().toISOString()
      }));
    }
  }

  async getUserProfile(userId) {
    const data = this.getStorageData();
    return data.profiles.find(p => p.userId === userId);
  }

  async saveUserProfile(profile) {
    const data = this.getStorageData();
    const index = data.profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      data.profiles[index] = profile;
    } else {
      data.profiles.push(profile);
    }
    this.saveStorageData(data);
  }

  async getMedalDatabase() {
    const data = this.getStorageData();
    return data.medals;
  }

  async addAchievement(userId, achievement) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('Profile not found');
    
    profile.prerequisites.push(achievement);
    await this.saveUserProfile(profile);
  }

  // ... other methods

  getStorageData() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  saveStorageData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}
```

### 2. Medal Calculator

**Purpose**: Determine medal status (unlocked, achievable, locked)

```javascript
// logic/calculator.js
class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase;
    this.profile = userProfile;
  }

  evaluateMedal(medalId) {
    const medal = this.medals.find(m => m.id === medalId);
    if (!medal) return null;

    const unlocked = this.hasUnlockedMedal(medalId);
    if (unlocked) {
      return {
        medalId,
        status: 'unlocked',
        unlockedDate: this.getUnlockedDate(medalId),
        details: {}
      };
    }

    const prereqsMet = this.checkPrerequisites(medal);
    if (!prereqsMet.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'prerequisites',
        details: prereqsMet
      };
    }

    const reqsMet = this.checkRequirements(medal);
    if (!reqsMet.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'requirements',
        details: reqsMet
      };
    }

    return {
      medalId,
      status: 'achievable',
      details: reqsMet
    };
  }

  checkPrerequisites(medal) {
    if (!medal.prerequisites || medal.prerequisites.length === 0) {
      return { allMet: true, items: [] };
    }

    const items = medal.prerequisites.map(prereq => {
      if (prereq.type === 'medal') {
        const isMet = this.hasUnlockedMedal(prereq.medalId);
        return {
          type: 'medal',
          medalId: prereq.medalId,
          isMet,
          achieved: isMet ? this.getUnlockedDate(prereq.medalId) : null
        };
      }
      return { type: prereq.type, isMet: false };
    });

    return {
      allMet: items.every(i => i.isMet),
      items
    };
  }

  checkRequirements(medal) {
    const items = medal.requirements.map(req => {
      if (req.type === 'gold_series') {
        return this.checkGoldSeriesRequirement(req);
      } else if (req.type === 'competition_result') {
        return this.checkCompetitionRequirement(req);
      }
      return { type: req.type, isMet: false };
    });

    return {
      allMet: items.every(i => i.isMet),
      items
    };
  }

  checkGoldSeriesRequirement(req) {
    const achievements = this.profile.prerequisites.filter(a => a.type === 'gold_series');
    
    let met = false;
    let progress = { current: 0, required: req.minAchievements || 1 };

    if (req.timeWindowYears) {
      // Check within time window
      const currentYear = new Date().getFullYear();
      const filteredAchievements = achievements.filter(a => 
        a.year >= (currentYear - req.timeWindowYears) && a.year <= currentYear
      );
      progress.current = filteredAchievements.length;
    } else {
      progress.current = achievements.length;
    }

    met = progress.current >= progress.required;

    return {
      type: 'gold_series',
      isMet: met,
      progress,
      achievements
    };
  }

  getAchievableMedals() {
    return this.medals
      .map(medal => this.evaluateMedal(medal.id))
      .filter(result => result && result.status === 'achievable');
  }

  hasUnlockedMedal(medalId) {
    return this.profile.unlockedMedals?.some(m => m.medalId === medalId) || false;
  }

  getUnlockedDate(medalId) {
    const unlocked = this.profile.unlockedMedals?.find(m => m.medalId === medalId);
    return unlocked ? unlocked.unlockedDate : null;
  }
}
```

### 3. Input Validator

**Purpose**: Validate user input against rules

```javascript
// logic/validator.js
class InputValidator {
  validateGoldSeriesInput(input) {
    const errors = [];

    if (!input.year || input.year < 2000 || input.year > new Date().getFullYear()) {
      errors.push('Invalid year');
    }

    if (!['A', 'B', 'C', 'R'].includes(input.weaponGroup)) {
      errors.push('Invalid weapon group');
    }

    if (input.points < 0 || input.points > 50) {
      errors.push('Points must be between 0 and 50');
    }

    if (!input.date) {
      errors.push('Date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateCompetitionResultInput(input) {
    const errors = [];

    if (!['national', 'regional/landsdels', 'crewmate/krets', 'championship']
        .includes(input.competitionType)) {
      errors.push('Invalid competition type');
    }

    if (!['bronze', 'silver', 'gold'].includes(input.medalType)) {
      errors.push('Invalid medal tier');
    }

    // ... more validation

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### 4. UI Router

**Purpose**: Simple SPA routing without framework

```javascript
// ui/router.js
class Router {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentView = null;
    this.history = [];
  }

  async navigate(viewName, params = {}) {
    let view;

    switch(viewName) {
      case 'home':
        view = new HomeView(params);
        break;
      case 'skill-tree':
        view = new SkillTreeView(params);
        break;
      case 'list':
        view = new ListViewController(params);
        break;
      case 'detail':
        view = new DetailModalView(params);
        break;
      default:
        view = new HomeView();
    }

    if (this.currentView) {
      this.currentView.destroy?.();
    }

    this.currentView = view;
    this.container.innerHTML = '';
    await view.render(this.container);
    this.history.push(viewName);
  }

  back() {
    if (this.history.length > 1) {
      this.history.pop();
      const previousView = this.history[this.history.length - 1];
      this.navigate(previousView);
    }
  }
}
```

---

## Data Flow

### User Achievement Entry Flow

```
User Input Form
    ↓
InputValidator.validate()
    ├─ Valid: Continue
    └─ Invalid: Show errors, stop
    ↓
DataManager.addAchievement(userId, achievement)
    ├─ Save to localStorage
    └─ Emit 'achievement:added' event
    ↓
MedalCalculator.evaluateAll()
    └─ Recalculate all medal statuses
    ↓
Update Profile.unlockedMedals
    ↓
DataManager.saveUserProfile(updatedProfile)
    ↓
UI Updates
    ├─ Show notification "Achievement saved"
    ├─ Update medal display
    └─ Highlight newly achievable medals
```

### Medal Status Evaluation Flow

```
User clicks medal node
    ↓
DetailView.onMedalSelect(medalId)
    ↓
MedalCalculator.evaluateMedal(medalId)
    ├─ Check prerequisites
    ├─ Check requirements
    └─ Return status + details
    ↓
DetailModalView.render(medalInfo)
    ├─ Display medal name, description
    ├─ Show prerequisite status
    ├─ Show requirement progress
    └─ Display next medals in chain
```

---

## Storage Schema

### LocalStorage Structure

```javascript
{
  version: "1.0",
  profiles: [
    {
      userId: "user-123",
      displayName: "Anna Skytteson",
      createdDate: "2025-01-15T10:00:00Z",
      lastModified: "2025-12-20T07:32:00Z",
      weaponGroupPreference: "A",
      
      unlockedMedals: [
        {
          medalId: "pistol-mark-bronze",
          unlockedDate: "2025-01-15",
          year: 2025
        }
      ],
      
      prerequisites: [
        {
          id: "gold-series-001",
          type: "gold_series",
          year: 2025,
          weaponGroup: "A",
          points: 42,
          date: "2025-06-15",
          competitionName: "Club Championship"
        }
      ]
    }
  ],
  medals: [
    // Medal database (loaded from medals.json)
  ],
  lastBackup: "2025-12-20T07:32:00Z"
}
```

---

## State Management Pattern (Without Redux)

### Event-Based Communication

```javascript
// utils/event-bus.js
class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]
        .filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

// Global event bus
const eventBus = new EventBus();

// Usage:
eventBus.on('achievement:added', (achievement) => {
  calculator.evaluateAll();
  updateUI();
});

eventBus.emit('achievement:added', newAchievement);
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Rendering**:
   - Only render visible medal nodes on canvas
   - Use viewport detection, virtual scrolling

2. **Debouncing**:
   - Pan/zoom events: debounce with 100ms delay
   - Input validation: debounce with 300ms delay

3. **Caching**:
   - Cache medal evaluation results
   - Invalidate cache on achievement change

4. **Memory Management**:
   - Clean up event listeners in view cleanup
   - Limit undo/history to last 50 changes

### Code Splitting (For Scaling)

```javascript
// main.js
const views = {
  home: () => import('./ui/views/home.js'),
  skillTree: () => import('./ui/views/skill-tree.js'),
  list: () => import('./ui/views/list-view.js'),
  settings: () => import('./ui/views/settings.js')
};

async function loadView(viewName) {
  const ViewModule = await views[viewName]();
  return ViewModule.default;
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// tests/calculator.test.js
describe('MedalCalculator', () => {
  it('should mark bronze medal as achievable when no prerequisites', () => {
    // Test case
  });

  it('should mark silver medal as locked when bronze not achieved', () => {
    // Test case
  });

  it('should check gold series requirements correctly', () => {
    // Test case
  });
});
```

### Integration Tests

```javascript
// tests/integration.test.js
describe('Achievement Flow', () => {
  it('should add achievement, calculate medals, and update UI', async () => {
    // Full flow test
  });
});
```

---

## Deployment & Build

### Single-File Version (POC)

For simplicity in POC, everything can be in one HTML file with inline JS/CSS.

### Multi-File Version

Use Vite or Webpack to bundle:
```bash
npm install
npm run build
# Outputs to dist/
```

### Hosting Options

- **Static Site**: GitHub Pages, Netlify, Vercel
- **Backend-Ready**: Can add Express API layer later

---

## Future Backend Integration

### API Endpoints (Designed For)

```
GET /api/medals                    # Get medal database
GET /api/users/:id/profile         # Get user profile
POST /api/users/:id/profile        # Update profile
GET /api/users/:id/achievements    # Get achievements
POST /api/users/:id/achievements   # Add achievement
DELETE /api/users/:id/achievements/:id
POST /api/users/:id/import         # Import data
GET /api/users/:id/export          # Export data
```

### Migration Path

1. Keep DataManager interface same
2. Create ApiDataManager class
3. Swap implementation in initialization
4. No UI changes needed

---

## Security Considerations

### Local Storage (POC)

- Data stored unencrypted in browser
- No sensitive data stored
- Users can export/backup manually

### Future Backend

- HTTPS required
- JWT authentication
- Rate limiting on API
- Input sanitization
- CORS enabled only for trusted domains

---

## Browser Compatibility

### Required APIs

- LocalStorage (IE 8+)
- Canvas API (IE 9+)
- ES6 (Modern browsers only)
- Fetch API (for future backend)

### Polyfills

May need for older browser support:
- Promise polyfill
- Fetch polyfill
- Object.assign polyfill

---

## Development Workflow

### Local Development

```bash
# No build needed for POC
# Just open index.html in browser

# Or run simple dev server
python -m http.server 8000
# Visit http://localhost:8000
```

### Code Style

- Consistent indentation (2 spaces)
- JSDoc comments for functions
- Descriptive variable names
- Single responsibility principle

---

## Debugging & Logging

```javascript
// utils/logger.js
class Logger {
  static log(message, data = null) {
    if (process.env.DEBUG) {
      console.log(`[APP] ${message}`, data);
    }
  }

  static error(message, error) {
    console.error(`[ERROR] ${message}`, error);
  }
}

// Usage:
Logger.log('Achievement added', achievement);
Logger.error('Failed to save profile', error);
```

---

## Documentation

### Code Documentation

- JSDoc comments on all public methods
- README.md with setup instructions
- ARCHITECTURE.md (this file)
- CONTRIBUTING.md for future contributors

### User Documentation

- In-app tutorial (video + text)
- FAQ section
- Help tooltips on UI elements
