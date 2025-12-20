# PR-004: Basic UI Shell & Views Structure

## DESCRIPTION
Implement the foundational UI architecture including view routing, header navigation, and base styles. This establishes the scaffold for subsequent UI PRs to build upon (per 03-Interaction-Design.md Views and 04-Visual-Design.md Component System).

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System
- PR-003: Medal Achievement Calculator

## ACCEPTANCE CRITERIA
- [ ] Simple SPA router working (navigate between views without page reload)
- [ ] Header navigation visible on all views with current view indicator
- [ ] Profile selector working (list saved profiles, switch between them)
- [ ] Home view displays welcome message and quick links
- [ ] Base styles applied using design system from 04-Visual-Design.md
- [ ] Mobile-responsive scaffolding in place per responsive breakpoints
- [ ] All interactions keyboard accessible
- [ ] Code structure follows 05-Technical-Architecture.md UI Layer design

## FILES TO CREATE
- js/ui/router.js (Simple SPA router)
- js/ui/views/home.js (Home/welcome view)
- js/ui/views/skill-tree.js (Skill-tree view scaffold)
- js/ui/views/list-view.js (List view scaffold)
- js/ui/views/settings.js (Settings view scaffold)
- js/ui/components/header.js (Navigation header)
- js/ui/components/profile-selector.js (Profile management)
- css/style.css (Base styles from design system)
- css/components.css (Component styles)
- css/responsive.css (Responsive styles)
- tests/router.test.js (Router tests)

## CODE STRUCTURE

### js/ui/router.js

Simple SPA router without external dependencies:

```javascript
/**
 * Simple single-page app router
 * Maps view names to modules and handles navigation
 */
class AppRouter {
  constructor(appRoot) {
    this.appRoot = appRoot;
    this.currentView = null;
    this.viewModules = new Map();
    this.routes = new Map();
    
    // Set up browser back button support
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.view) {
        this.navigateTo(e.state.view, null, false);
      }
    });
  }
  
  /**
   * Register a route
   * @param {string} name - View name (e.g., 'home', 'skill-tree')
   * @param {string} path - URL path (e.g., '/', '/skill-tree')
   * @param {Object} viewModule - View class with render() method
   */
  registerRoute(name, path, viewModule) {
    this.routes.set(name, { path, viewModule });
    this.viewModules.set(name, viewModule);
  }
  
  /**
   * Navigate to a view
   * @param {string} viewName - Name of view to navigate to
   * @param {Object} params - Optional parameters to pass to view
   * @param {boolean} pushHistory - Whether to push to history (default true)
   */
  navigateTo(viewName, params = null, pushHistory = true) {
    const route = this.routes.get(viewName);
    if (!route) {
      console.error(`View not found: ${viewName}`);
      return;
    }
    
    // Clear current view
    this.appRoot.innerHTML = '';
    
    // Create new view instance
    const ViewClass = route.viewModule;
    this.currentView = new ViewClass(params || {});
    
    // Render view
    const html = this.currentView.render();
    this.appRoot.innerHTML = html;
    
    // Bind event listeners
    if (this.currentView.bindEvents) {
      this.currentView.bindEvents(this.appRoot);
    }
    
    // Update history
    if (pushHistory) {
      window.history.pushState(
        { view: viewName, params },
        '',
        route.path
      );
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  /**
   * Get current view name
   */
  getCurrentViewName() {
    return Array.from(this.routes.entries()).find(
      ([name, route]) => this.currentView instanceof route.viewModule
    )?.[0] || null;
  }
}

/**
 * Base view class
 * All views should extend this
 */
class BaseView {
  constructor(params = {}) {
    this.params = params;
    this.data = {};
  }
  
  /**
   * Return HTML for this view
   * Must be implemented by subclasses
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }
  
  /**
   * Bind event listeners to DOM
   * Optional - override if your view has interactivity
   */
  bindEvents(container) {
    // Default: no events
  }
}
```

### js/ui/components/header.js

Navigation header with profile selector:

```javascript
/**
 * Main navigation header
 * Displays app title, current view, and navigation links
 */
class Header {
  constructor(currentViewName, onViewChange, onNewProfile) {
    this.currentViewName = currentViewName;
    this.onViewChange = onViewChange;
    this.onNewProfile = onNewProfile;
  }
  
  render() {
    return `
      <header class="header" role="banner">
        <div class="header__container">
          <div class="header__logo">
            <h1 class="header__title">🎖️ Medal Skill-Tree</h1>
          </div>
          
          <nav class="header__nav" role="navigation">
            <ul class="nav__list">
              <li class="nav__item">
                <a href="#home" 
                   class="nav__link ${this.currentViewName === 'home' ? 'nav__link--active' : ''}"
                   data-view="home">
                  Home
                </a>
              </li>
              <li class="nav__item">
                <a href="#skill-tree" 
                   class="nav__link ${this.currentViewName === 'skill-tree' ? 'nav__link--active' : ''}"
                   data-view="skill-tree">
                  Skill Tree
                </a>
              </li>
              <li class="nav__item">
                <a href="#list-view" 
                   class="nav__link ${this.currentViewName === 'list-view' ? 'nav__link--active' : ''}"
                   data-view="list-view">
                  Medals
                </a>
              </li>
              <li class="nav__item">
                <a href="#settings" 
                   class="nav__link ${this.currentViewName === 'settings' ? 'nav__link--active' : ''}"
                   data-view="settings">
                  Settings
                </a>
              </li>
            </ul>
          </nav>
          
          <div class="header__profile">
            <button class="btn btn--secondary btn--sm" id="profile-btn">
              👤 Profile
            </button>
          </div>
        </div>
      </header>
    `;
  }
  
  bindEvents(container) {
    // Navigation link clicks
    container.querySelectorAll('[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        this.onViewChange(view);
      });
    });
    
    // Profile button
    const profileBtn = container.querySelector('#profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.onNewProfile();
      });
    }
  }
}
```

### js/ui/components/profile-selector.js

Profile management modal:

```javascript
/**
 * Profile selector modal
 * Allow users to create new profile, load existing, or delete
 */
class ProfileSelector {
  constructor(profiles, onSelect, onCreate, onDelete) {
    this.profiles = profiles;
    this.onSelect = onSelect;
    this.onCreate = onCreate;
    this.onDelete = onDelete;
  }
  
  render() {
    const profileItems = this.profiles.map(p => `
      <div class="profile-item card">
        <div class="card__body">
          <h3 class="profile-item__name">${p.displayName}</h3>
          <p class="profile-item__meta">
            <span class="profile-item__weapon">Group: ${p.weaponGroupPreference}</span>
            <span class="profile-item__created">Created: ${new Date(p.createdDate).toLocaleDateString()}</span>
          </p>
          <div class="profile-item__actions">
            <button class="btn btn--primary btn--sm" data-action="select" data-user-id="${p.userId}">
              Load
            </button>
            <button class="btn btn--outline btn--sm" data-action="delete" data-user-id="${p.userId}">
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="modal modal--active" id="profile-modal">
        <div class="modal__overlay" id="modal-overlay"></div>
        <div class="modal__content">
          <div class="modal__header">
            <h2 class="modal__title">Select Profile</h2>
            <button class="modal__close" id="modal-close" aria-label="Close">✕</button>
          </div>
          
          <div class="modal__body">
            ${this.profiles.length === 0 
              ? '<p class="modal__empty">No profiles yet. Create one to get started!</p>'
              : `<div class="profile-list">${profileItems}</div>`
            }
            
            <div class="modal__divider"></div>
            
            <button class="btn btn--primary btn--full-width" id="new-profile-btn">
              ➕ Create New Profile
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  bindEvents(container) {
    // Load profile
    container.querySelectorAll('[data-action="select"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        const profile = this.profiles.find(p => p.userId === userId);
        if (profile) this.onSelect(profile);
      });
    });
    
    // Delete profile
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        if (confirm('Are you sure? This cannot be undone.')) {
          this.onDelete(userId);
        }
      });
    });
    
    // Close modal
    const closeBtn = container.querySelector('#modal-close');
    const overlay = container.querySelector('#modal-overlay');
    const modal = container.querySelector('#profile-modal');
    
    const closeModal = () => {
      modal.classList.remove('modal--active');
    };
    
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
    
    // Create new profile
    container.querySelector('#new-profile-btn')?.addEventListener('click', () => {
      this.onCreate();
    });
  }
}
```

### js/ui/views/home.js

Home/welcome view:

```javascript
/**
 * Home view - welcome screen and quick links
 */
class HomeView extends BaseView {
  render() {
    return `
      <main class="main-content">
        <div class="container py-16">
          <section class="hero">
            <h2 class="hero__title">Welcome to Medal Skill-Tree Explorer</h2>
            <p class="hero__subtitle">Track your SHB medal achievements and plan your progression</p>
          </section>
          
          <section class="quick-links">
            <h3 class="section-title">Get Started</h3>
            <div class="grid grid-3">
              <div class="card">
                <div class="card__body">
                  <h4 class="card__title">🎯 Explore Medals</h4>
                  <p class="card__text">Browse the interactive skill-tree and discover all available medals</p>
                  <a href="#skill-tree" class="btn btn--primary btn--full-width" data-view="skill-tree">
                    View Skill Tree
                  </a>
                </div>
              </div>
              
              <div class="card">
                <div class="card__body">
                  <h4 class="card__title">📝 Log Achievements</h4>
                  <p class="card__text">Track your gold series, competitions, and other achievements</p>
                  <a href="#settings" class="btn btn--primary btn--full-width" data-view="settings">
                    Go to Settings
                  </a>
                </div>
              </div>
              
              <div class="card">
                <div class="card__body">
                  <h4 class="card__title">📊 View Progress</h4>
                  <p class="card__text">See which medals you've unlocked and what's achievable next</p>
                  <a href="#list-view" class="btn btn--primary btn--full-width" data-view="list-view">
                    View Medals List
                  </a>
                </div>
              </div>
            </div>
          </section>
          
          <section class="info">
            <h3 class="section-title">About This App</h3>
            <p>This is a skill-tree explorer for SHB (Svenska Skytte Förbundet) medals. Track your shooting achievements and visualize your path through the medal progression system.</p>
            <p><strong>No account required</strong> - Your data is stored locally in your browser.</p>
          </section>
        </div>
      </main>
    `;
  }
  
  bindEvents(container) {
    container.querySelectorAll('[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // Router will handle navigation
      });
    });
  }
}
```

### js/ui/views/skill-tree.js

Skill-tree view scaffold (canvas rendering in next PR):

```javascript
/**
 * Skill-Tree view - interactive medal visualization
 */
class SkillTreeView extends BaseView {
  render() {
    return `
      <main class="main-content skill-tree-layout">
        <aside class="skill-tree__sidebar">
          <div class="sidebar-panel">
            <h3 class="sidebar-panel__title">Filters</h3>
            <div class="filter-group">
              <label class="filter-label">
                <input type="checkbox" id="filter-unlocked" checked>
                Show Unlocked
              </label>
              <label class="filter-label">
                <input type="checkbox" id="filter-achievable" checked>
                Show Achievable
              </label>
              <label class="filter-label">
                <input type="checkbox" id="filter-locked">
                Show Locked
              </label>
            </div>
          </div>
          
          <div class="sidebar-panel" id="medal-details">
            <h3 class="sidebar-panel__title">Medal Details</h3>
            <p class="sidebar-text">Click a medal to see details</p>
          </div>
        </aside>
        
        <div class="skill-tree__canvas-container">
          <canvas id="skill-tree-canvas" class="skill-tree-canvas"></canvas>
          <div class="canvas-controls">
            <button class="btn btn--secondary btn--sm" id="zoom-in">🔍+</button>
            <button class="btn btn--secondary btn--sm" id="zoom-out">🔍−</button>
            <button class="btn btn--secondary btn--sm" id="reset-view">Reset</button>
          </div>
        </div>
      </main>
    `;
  }
  
  bindEvents(container) {
    // Filter checkboxes
    container.querySelectorAll('.filter-label input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // Filter logic will be implemented in next PR
        console.log('Filter changed');
      });
    });
    
    // Canvas controls
    container.querySelector('#zoom-in')?.addEventListener('click', () => {
      console.log('Zoom in');
    });
    
    container.querySelector('#zoom-out')?.addEventListener('click', () => {
      console.log('Zoom out');
    });
    
    container.querySelector('#reset-view')?.addEventListener('click', () => {
      console.log('Reset view');
    });
  }
}
```

### js/ui/views/list-view.js

List view scaffold:

```javascript
/**
 * List View - traditional table view of medals
 */
class ListViewView extends BaseView {
  render() {
    return `
      <main class="main-content list-layout">
        <aside class="list__sidebar">
          <div class="filter-panel">
            <h3 class="filter-panel__title">Filter</h3>
            <div class="form-group">
              <label class="form-label" for="filter-type">Medal Type</label>
              <select id="filter-type" class="form-control">
                <option value="">All Types</option>
                <option value="pistol_mark">Pistol Mark</option>
                <option value="elite_mark">Elite Mark</option>
                <option value="field_mark">Field Mark</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filter-tier">Tier</label>
              <select id="filter-tier" class="form-control">
                <option value="">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="filter-status">Status</label>
              <select id="filter-status" class="form-control">
                <option value="">All Status</option>
                <option value="unlocked">Unlocked</option>
                <option value="achievable">Achievable</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>
        </aside>
        
        <div class="list__content">
          <div class="list-header">
            <h2>Medals</h2>
            <div class="sort-options">
              <select id="sort-by" class="form-control">
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="difficulty">Sort by Difficulty</option>
              </select>
            </div>
          </div>
          
          <div class="medals-list" id="medals-list">
            <!-- Will be populated by JS -->
          </div>
        </div>
      </main>
    `;
  }
  
  bindEvents(container) {
    // Filter selects
    container.querySelector('#filter-type')?.addEventListener('change', () => {
      console.log('Type filter changed');
    });
    
    container.querySelector('#filter-tier')?.addEventListener('change', () => {
      console.log('Tier filter changed');
    });
    
    container.querySelector('#filter-status')?.addEventListener('change', () => {
      console.log('Status filter changed');
    });
    
    container.querySelector('#sort-by')?.addEventListener('change', () => {
      console.log('Sort changed');
    });
  }
}
```

### js/ui/views/settings.js

Settings view scaffold:

```javascript
/**
 * Settings View - profile management and import/export
 */
class SettingsView extends BaseView {
  render() {
    return `
      <main class="main-content">
        <div class="container py-16">
          <h2 class="page-title">Settings</h2>
          
          <section class="settings-section card">
            <h3 class="settings-section__title">Add Achievement</h3>
            <form id="achievement-form" class="form">
              <div class="form-group">
                <label class="form-label" for="achievement-type">Type</label>
                <select id="achievement-type" class="form-control" required>
                  <option value="">-- Select --</option>
                  <option value="gold_series">Gold Series</option>
                  <option value="competition_result">Competition Result</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="achievement-year">Year</label>
                <input type="number" id="achievement-year" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="achievement-group">Weapon Group</label>
                <select id="achievement-group" class="form-control" required>
                  <option value="">-- Select --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="achievement-points">Points</label>
                <input type="number" id="achievement-points" class="form-control" required>
              </div>
              
              <button type="submit" class="btn btn--primary btn--full-width">
                Add Achievement
              </button>
            </form>
          </section>
          
          <section class="settings-section card">
            <h3 class="settings-section__title">Data Management</h3>
            <div class="button-group">
              <button class="btn btn--secondary" id="export-btn">📥 Export Data</button>
              <button class="btn btn--secondary" id="import-btn">📤 Import Data</button>
              <input type="file" id="import-file" accept=".json" style="display:none">
            </div>
          </section>
        </div>
      </main>
    `;
  }
  
  bindEvents(container) {
    // Achievement form
    container.querySelector('#achievement-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Achievement submitted');
    });
    
    // Export button
    container.querySelector('#export-btn')?.addEventListener('click', () => {
      console.log('Export clicked');
    });
    
    // Import button
    container.querySelector('#import-btn')?.addEventListener('click', () => {
      container.querySelector('#import-file').click();
    });
    
    // Import file
    container.querySelector('#import-file')?.addEventListener('change', (e) => {
      console.log('File selected for import');
    });
  }
}
```

### css/style.css

Base styles using design system variables (see 04-Visual-Design.md):

```css
:root {
  /* Colors */
  --color-bg-primary: #fcfcf9;
  --color-bg-secondary: #ffffff;
  --color-text-primary: #133452;
  --color-text-secondary: #626c71;
  --color-primary: #208491;
  --color-primary-hover: #1d745f;
  --color-accent: #32b8c6;
  
  /* Spacing */
  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-20: 20px;
  --space-24: 24px;
  --space-32: 32px;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

* {
  box-sizing: border-box;
}

html {
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

body {
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: 600;
  line-height: 1.2;
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }

p {
  margin: 0 0 var(--space-16) 0;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Layout */
.header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid #e0e0e0;
  padding: var(--space-16) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-16);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-32);
}

.header__title {
  margin: 0;
  font-size: var(--font-size-2xl);
}

.header__nav {
  flex: 1;
}

.nav__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--space-16);
}

.nav__link {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.nav__link:hover {
  background: rgba(0,0,0,0.05);
  color: var(--color-text-primary);
}

.nav__link--active {
  background: var(--color-primary);
  color: white;
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-32) var(--space-16);
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-16);
}

/* Utility classes */
.py-16 { padding-top: var(--space-16); padding-bottom: var(--space-16); }

.grid {
  display: grid;
  gap: var(--space-16);
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### tests/router.test.js

Router tests:

```javascript
describe('AppRouter', () => {
  let router;
  let appRoot;
  let TestView;
  
  beforeEach(() => {
    appRoot = document.createElement('div');
    appRoot.id = 'app-root';
    document.body.appendChild(appRoot);
    
    router = new AppRouter(appRoot);
    
    // Create test view
    TestView = class extends BaseView {
      render() {
        return '<div id="test-view">Test View</div>';
      }
    };
  });
  
  afterEach(() => {
    document.body.removeChild(appRoot);
  });
  
  test('registers route', () => {
    router.registerRoute('test', '/test', TestView);
    expect(router.routes.has('test')).toBe(true);
  });
  
  test('navigates to view', () => {
    router.registerRoute('test', '/test', TestView);
    router.navigateTo('test');
    
    expect(appRoot.querySelector('#test-view')).toBeDefined();
  });
  
  test('throws error for non-existent view', () => {
    expect(() => router.navigateTo('nonexistent')).not.toThrow();
  });
  
  test('calls bindEvents on view', () => {
    const ViewWithEvents = class extends BaseView {
      render() { return '<div>Test</div>'; }
      bindEvents(container) {
        container.setAttribute('data-events-bound', 'true');
      }
    };
    
    router.registerRoute('test', '/test', ViewWithEvents);
    router.navigateTo('test');
    
    expect(appRoot.getAttribute('data-events-bound')).toBe('true');
  });
});
```

## DESIGN DOCUMENT REFERENCES
- **03-Interaction-Design.md** - Views section (Home, Skill-Tree, List, Settings)
- **04-Visual-Design.md** - Design System and Component Specifications
- **05-Technical-Architecture.md** - UI Layer and Router design

## RESPONSIVE BEHAVIOR
- **Mobile** (<768px): Single column, full-width, dropdown menus
- **Tablet** (768-1024px): Two column where applicable
- **Desktop** (>1024px): Full layout with sidebars

## KEYBOARD NAVIGATION
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals

## ACCESSIBILITY
- All buttons and links keyboard accessible
- Focus indicators visible
- Semantic HTML (nav, main, aside, section)
- ARIA labels where appropriate

## DONE WHEN
- Router navigates between views without page reload
- Header visible and functional on all views
- Profile selector works (display, load, delete)
- All views render correctly
- Mobile responsive working
- Keyboard navigation working
- All tests pass
- No console errors
