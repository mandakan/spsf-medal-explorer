# Contributing to Medal Skill-Tree Explorer

Thank you for interest in contributing to the Medal Skill-Tree Explorer! This guide will help you get started.

## 📖 Before You Start

Please read these documents first:
1. **[README.md](README.md)** - Project overview and quick start
2. **[docs/00-README.md](docs/00-README.md)** - Design documentation overview
3. **[docs/01-Product-Vision.md](docs/01-Product-Vision.md)** - Problem and vision
4. **[docs/05-Technical-Architecture.md](docs/05-Technical-Architecture.md)** - Architecture and modules

## 🎯 How Can You Contribute?

### Code
- Implement features from the roadmap
- Fix bugs
- Improve performance
- Write tests
- Refactor for clarity

### Design
- Create visual mockups
- Iterate on interaction flows
- Improve accessibility
- Enhance mobile experience

### Documentation
- Clarify existing docs
- Add code examples
- Fix typos and errors
- Create tutorials

### Data
- Verify medal requirements
- Ensure SHB accuracy
- Test calculation logic
- Create test cases

### Testing
- Create test cases
- Perform QA testing
- Report bugs with examples
- Validate user flows

## 🏗️ Architecture Principles

Before coding, understand these principles:

### 1. Layered Architecture
```
UI Layer (Views, Components)
    ↓
Logic Layer (Calculators, Validators)
    ↓
Data Layer (Storage, Models)
```

**Why**: Easy to test, maintain, and extend

### 2. Separation of Concerns
- **UI** = How things look and interact
- **Logic** = What calculations happen
- **Data** = How information is stored

**Why**: Each layer can be tested/modified independently

### 3. Dependency Injection
- Pass dependencies in, don't create them inside
- Inject storage, don't hardcode localStorage

**Why**: Easy to test with mocks, swap implementations

### 4. No External Dependencies (POC)
- Vanilla JavaScript only in POC
- No jQuery, React, Vue, etc. yet
- This keeps it simple and portable

**Why**: Single HTML file deployment, easy to understand

## 🗂️ Project Structure

```
medal-app/
├── index.html                 # Entry point
├── css/
│   ├── style.css             # Global styles
│   ├── components.css        # Component styles
│   └── responsive.css        # Mobile/responsive
├── js/
│   ├── main.js               # App initialization
│   ├── app.js                # Main controller
│   ├── data/
│   │   ├── data-manager.js   # Abstract interface
│   │   ├── storage.js        # localStorage impl
│   │   └── models.js         # Data models
│   ├── logic/
│   │   ├── calculator.js     # Medal calculator
│   │   ├── validator.js      # Input validation
│   │   └── exporter.js       # Import/export
│   ├── ui/
│   │   ├── views/
│   │   │   ├── home.js
│   │   │   ├── skill-tree.js
│   │   │   ├── list-view.js
│   │   │   └── settings.js
│   │   ├── components/
│   │   │   ├── medal-node.js
│   │   │   ├── form.js
│   │   │   └── modal.js
│   │   └── router.js         # SPA routing
│   └── utils/
│       ├── event-bus.js      # Component communication
│       ├── logger.js         # Logging
│       └── helpers.js        # Utilities
├── data/
│   └── medals.json           # Medal database
├── docs/                     # Design documentation
├── tests/
│   ├── calculator.test.js
│   ├── validator.test.js
│   └── integration.test.js
├── README.md
├── CONTRIBUTING.md           # This file
└── package.json              # Project metadata
```

### Adding a New Feature

**Follow this structure:**

1. **Create data models** → `js/data/models.js`
2. **Add logic** → `js/logic/[feature].js`
3. **Create UI components** → `js/ui/components/[feature].js`
4. **Build view/integration** → `js/ui/views/[feature].js`
5. **Write tests** → `tests/[feature].test.js`
6. **Update docs** → `docs/` and `README.md`

## 💻 Coding Standards

### File Naming
- **Classes/constructors**: PascalCase (`MedalCalculator.js`)
- **Functions/utilities**: camelCase (`calculateMedal.js`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`)

### Code Style

**Use JSDoc for public methods:**
```javascript
/**
 * Evaluates medal status based on user achievements
 * @param {string} medalId - Medal to evaluate
 * @returns {Object} Status with details
 */
calculateMedalStatus(medalId) {
  // Implementation
}
```

**Descriptive names:**
```javascript
// ✅ Good
const isAchievable = calculator.checkIfMedalAchievable(medalId);

// ❌ Poor
const result = calc.check(id);
```

**Single responsibility:**
```javascript
// ✅ Good - one job
function validateGoldSeriesInput(input) {
  // Validation logic
}

// ❌ Poor - multiple jobs
function handleInput(input) {
  // Validation + calculation + storage
}
```

**Const/let, no var:**
```javascript
// ✅ Good
const config = { /* ... */ };
let counter = 0;

// ❌ Avoid
var config = { /* ... */ };
```

**Arrow functions for callbacks:**
```javascript
// ✅ Good
achievements.filter(a => a.year === 2025)

// ❌ Less ideal
achievements.filter(function(a) { return a.year === 2025; })
```

### Error Handling
```javascript
// ✅ Good - clear error messages
if (!userId) {
  throw new Error('userId is required for profile lookup');
}

// ❌ Vague
if (!userId) {
  throw new Error('Invalid input');
}
```

## 🧪 Testing

### Write Tests For:
- **Business logic** (calculator, validator)
- **Data transformations** (import/export)
- **Edge cases** (boundary values, null inputs)
- **Medal calculations** (prerequisite chains)

### Test Structure
```javascript
describe('MedalCalculator', () => {
  let calculator;
  
  beforeEach(() => {
    // Setup
    calculator = new MedalCalculator(medalDb, profile);
  });
  
  it('should mark bronze as achievable with 3 gold series', () => {
    // Arrange
    const profile = { prerequisites: [{ /* 3 gold series */ }] };
    
    // Act
    const result = calculator.evaluateMedal('pistol-mark-bronze');
    
    // Assert
    expect(result.status).toBe('achievable');
  });
});
```

### Running Tests
```bash
# All tests
npm test

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 🔄 Git Workflow

### Branch Naming
- `feature/[name]` - New feature
- `bugfix/[name]` - Bug fix
- `docs/[name]` - Documentation
- `refactor/[name]` - Code refactoring

### Commit Messages
```
# ✅ Good
Add medal calculator with prerequisite checking
Fix off-by-one error in star progression validation
Update skill-tree canvas layout algorithm

# ❌ Poor
fix bug
update code
changes
```

### Pull Request Process

1. **Create feature branch:**
   ```bash
   git checkout -b feature/skill-tree-canvas
   ```

2. **Make changes and test locally:**
   ```bash
   npm test
   npm run build  # If applicable
   ```

3. **Commit with clear messages:**
   ```bash
   git commit -m "Add canvas-based skill tree visualization"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/skill-tree-canvas
   ```

5. **PR description should include:**
   - What does this do?
   - Why is it needed?
   - What design docs does it relate to?
   - Any testing performed?
   - Screenshots/links if applicable

6. **Example PR template:**
   ```markdown
   ## Description
   Implements interactive skill-tree canvas visualization with pan/zoom controls.
   Relates to 03-Interaction-Design.md section 2.
   
   ## Related Documents
   - 03-Interaction-Design.md (Section 2: Skill-Tree Canvas View)
   - 04-Visual-Design.md (Component Specifications)
   
   ## Testing
   - [x] Manual testing on mobile
   - [x] Canvas renders 100+ medals at 60fps
   - [x] Touch pan/zoom works smoothly
   - [ ] Need QA on edge cases
   
   ## Screenshots
   [Desktop] [Mobile]
   ```

7. **Address review feedback:**
   - Make requested changes
   - Re-request review
   - Iterate until approved

8. **Squash and merge** (if many commits)

## 📝 Documentation Standards

### Code Documentation
- **Public methods** need JSDoc
- **Complex logic** needs inline comments explaining "why"
- **Constants** should explain their purpose

### Design Documentation
When implementing a feature:
1. Check if documented in `/docs`
2. If not, add to relevant document
3. Update examples with your implementation
4. Keep documentation current with code

**Example: Adding Achievement Input**
- Document in `03-Interaction-Design.md` (interaction flow)
- Document in `04-Visual-Design.md` (form styling)
- Document in `05-Technical-Architecture.md` (module structure)
- Add code examples to relevant doc

## 🎨 Design-First Approach

**Important**: Design documents are source of truth.

1. **Before coding**, read relevant design doc sections
2. **During coding**, refer to design for:
   - Layout specifications
   - Interaction patterns
   - Data structures
   - User flows
3. **If design is wrong**, update docs first, then code
4. **Never** code something not in the design docs (discuss first)

## 🐛 Reporting Bugs

**Include:**
1. **What were you doing?** (Steps to reproduce)
2. **What happened?** (Actual behavior)
3. **What should happen?** (Expected behavior)
4. **Browser/device:** (Chrome on iPhone, Firefox on Windows, etc.)
5. **Screenshot/logs:** (If applicable)

**Example:**
```
Title: Medal status not updating after achievement input

Steps:
1. Create new profile
2. Add gold series: Year 2025, Group A, 42 points
3. View skill-tree
4. Click Bronze Pistol Mark medal

Expected: Status shows "Achievable" with green highlight
Actual: Status shows "Locked" in gray

Browser: Chrome 120, Windows 11
```

## 🚀 Performance Guidelines

### What to Optimize
- Canvas rendering (aim for 60fps)
- Medal calculations (cache when possible)
- Storage operations (batch writes)
- Input validation (debounce)

### How to Measure
```javascript
// Basic timing
const start = performance.now();
calculator.evaluateAllMedals();
const duration = performance.now() - start;
console.log(`Calculation took ${duration}ms`);
```

### Avoid
- Heavy loops in UI rendering
- Recalculating medal status unnecessarily
- Loading all data at once
- Synchronous file operations

## ♿ Accessibility Standards

### WCAG AA Compliance
- Color contrast: 4.5:1 for normal text
- Focus indicators visible on all interactive elements
- Keyboard navigation works throughout
- Screen reader labels on all form inputs

### Testing
```javascript
// Test keyboard navigation
// Test with screen reader (NVDA, JAWS, VoiceOver)
// Test color contrast with tools (WebAIM, WAVE)
```

## 📚 Resources

### Learning
- **SHB Medal System**: See `docs/07-Medal-Database-Reference.md`
- **Architecture**: See `docs/05-Technical-Architecture.md`
- **Interactions**: See `docs/03-Interaction-Design.md`
- **Visual Design**: See `docs/04-Visual-Design.md`

### Tools
- **Git**: `git --version` (check installed)
- **Node**: `node --version` (optional, for tests)
- **Browser DevTools**: Built-in (F12)

### External References
- [MDN Web Docs](https://developer.mozilla.org)
- [SHB Skjuthandbok](https://www.shb.se) (Official handbook)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤔 Common Questions

**Q: Can I use a framework like React?**
A: Not in POC. Vanilla JS keeps it simple. But the architecture is designed to support frameworks later.

**Q: Do I need Node.js installed?**
A: No for POC. Just open `index.html` in a browser. Node is optional for tests.

**Q: What if I find a medal rule is wrong?**
A: Great catch! Create an issue with the SHB handbook reference, then update `docs/07-Medal-Database-Reference.md` and the medal database.

**Q: How do I test on mobile?**
A: Use browser DevTools device emulation, or deploy to a test server and visit on phone.

**Q: Can I add my own medal types?**
A: Only SHB official medals in POC. Discuss any custom types in an issue first.

**Q: What about performance on slow connections?**
A: POC targets modern browsers on decent connections. Optimization comes in Phase 2.

## 📞 Getting Help

1. **Check the docs** - Start with `docs/00-README.md`
2. **Search issues** - Someone might have asked before
3. **Ask in PR/issue** - Describe what you're stuck on
4. **Consult team** - Slack, email, or sync meeting

## 🎓 New to the Project?

1. **Read** `README.md` (10 min)
2. **Read** `docs/00-README.md` and `docs/01-Product-Vision.md` (20 min)
3. **Review** `docs/05-Technical-Architecture.md` (30 min)
4. **Explore** the `/js` folder structure (20 min)
5. **Pick a small feature** from the roadmap
6. **Ask questions** if stuck

Total: ~1.5 hours to be productive

## ✅ Checklist Before Submitting PR

- [ ] Code follows style guide
- [ ] JSDoc added for public methods
- [ ] Tests written and passing
- [ ] Local testing completed
- [ ] Design documents match implementation
- [ ] No console errors/warnings
- [ ] Mobile responsive tested
- [ ] Accessibility check (keyboard nav, contrast)
- [ ] PR description is clear
- [ ] Related docs updated

## 🙏 Thank You!

Your contributions make this project better. We appreciate:
- Code that solves real problems
- Tests that catch bugs
- Documentation that clarifies
- Feedback that improves design
- Enthusiasm and patience

**Happy contributing!** 🚀
