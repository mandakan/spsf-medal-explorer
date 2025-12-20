# Quick Start Guide: Using PR Specs with Aider

This guide explains how to use the 4 PR specification documents with Aider or similar AI code generation tools.

---

## Setup (5 minutes)

### 1. Initialize Repository

```bash
# Create project directory
mkdir medal-app
cd medal-app

# Initialize git
git init

# Create initial files
touch index.html package.json README.md
```

### 2. Get the PR Specs

You should have received:
- `PR-001-Project-Setup-Medal-Database.md`
- `PR-002-Data-Layer-Storage.md`
- `PR-003-Medal-Calculator.md`
- `PR-004-Basic-UI-Shell.md`
- `PR-ROADMAP.md` (this file describes the sequence)

### 3. Open Aider

```bash
# Install Aider (if not already installed)
pip install aider-chat

# Start Aider in your project directory
aider
```

---

## Working Through Each PR (Template)

### For PR-001: Project Setup & Medal Database

#### Step 1: Read the PR Spec

Open `PR-001-Project-Setup-Medal-Database.md` and review:
- DESCRIPTION (what you're building)
- ACCEPTANCE CRITERIA (how to know when you're done)
- DESIGN DOCUMENT REFERENCES (read these sections first!)

#### Step 2: Understand Medal System

Before coding, read:
```
07-Medal-Database-Reference.md (entire file)
02-Data-Model.md (Medal Object section)
```

This teaches you about SHB medal rules, point thresholds, etc.

#### Step 3: Prompt Aider

In Aider, provide the complete PR spec:

```
Implement PR-001: Project Setup & Medal Database

Here's the full spec:
[PASTE ENTIRE PR-001 SPEC HERE]

Please implement all files exactly as specified:
- Follow the FILES TO CREATE section
- Use the CODE STRUCTURE examples
- Create the medals.json with all medal types
- Write the tests in tests/medals.test.js
```

#### Step 4: Verify with Tests

```bash
# In your terminal (outside Aider)
npm test tests/medals.test.js

# All tests should pass
```

#### Step 5: Review & Commit

```bash
# Check what was created
ls -la

# Review key files
cat data/medals.json | head -50
cat js/data/models.js | head -50

# Commit to git
git add .
git commit -m "PR-001: Project Setup & Medal Database"
```

#### Step 6: Move to PR-002

Once PR-001 passes all tests, start PR-002 in a new Aider session.

---

## For Each Subsequent PR

### PR-002: Data Layer & Storage

```
[Start fresh Aider session]

I have completed PR-001 (Project Setup & Medal Database).

Now implement PR-002: Data Layer & Storage System

Here's the full spec:
[PASTE ENTIRE PR-002 SPEC HERE]

PR-002 depends on PR-001. All previous classes should still work.
```

Run tests:
```bash
npm test tests/storage.test.js
npm test tests/exporter.test.js
```

### PR-003: Medal Achievement Calculator

```
[Start fresh Aider session]

I have completed PR-001 and PR-002.

Now implement PR-003: Medal Achievement Calculator

Here's the full spec:
[PASTE ENTIRE PR-003 SPEC HERE]
```

Run tests:
```bash
npm test tests/calculator.test.js
npm test tests/validator.test.js
```

### PR-004: Basic UI Shell & Views Structure

```
[Start fresh Aider session]

I have completed PR-001, PR-002, and PR-003.

Now implement PR-004: Basic UI Shell & Views Structure

Here's the full spec:
[PASTE ENTIRE PR-004 SPEC HERE]
```

Run tests:
```bash
npm test tests/router.test.js
```

Start the dev server:
```bash
npm run dev
# Open http://localhost:8000 in browser
```

---

## Tips for Success

### 1. Read Design Documents First

Before each PR, read the referenced design documents:

**PR-001**: 
- 07-Medal-Database-Reference.md (entire)
- 02-Data-Model.md (Medal Object section)

**PR-002**: 
- 02-Data-Model.md (Storage Schema section)
- 05-Technical-Architecture.md (Data Layer section)

**PR-003**: 
- 02-Data-Model.md (Calculation Engine section)
- 07-Medal-Database-Reference.md (point thresholds)
- 05-Technical-Architecture.md (MedalCalculator section)

**PR-004**: 
- 03-Interaction-Design.md (Views section)
- 04-Visual-Design.md (Design System section)
- 05-Technical-Architecture.md (UI Layer section)

### 2. Follow Dependencies Strictly

Don't skip PRs or do them out of order. The dependency graph in PR-ROADMAP.md shows why:

```
PR-001 → PR-002 → PR-003 → PR-004 → PR-005, PR-006, PR-007
```

Each PR needs classes and data from previous ones.

### 3. Use Test Results as Specification

The test cases in each PR spec ARE the specification. If a test fails:

1. Read the test carefully - it explains what's expected
2. Check your implementation - likely doesn't match spec exactly
3. Review the code structure section - copy it more carefully
4. Ask Aider to fix the specific test

### 4. Common Issues & Fixes

**Issue: "Module not found" errors**
- Verify all files were created in correct locations
- Check file names match exactly (case-sensitive)
- Verify imports point to correct paths

**Issue: "Test fails but code looks right"**
- Tests might be very specific (e.g., exact error messages)
- Read the test failure carefully
- Compare your implementation to the spec code sample
- Ask Aider: "Why is test X failing? Here's the error..."

**Issue: "Aider generated code that doesn't match spec"**
- Aider might misunderstand - be very explicit
- Copy the code samples from the spec verbatim if possible
- Say: "Use this exact code structure" and paste the spec

### 5. After Each PR

Always verify before moving on:

```bash
# Run all tests for this PR
npm test tests/[pr-name].test.js

# Check no console errors
npm run build  # if applicable

# Commit to git
git commit -m "PR-XXX: [Description]"
```

---

## Working with Aider Effectively

### Good Prompts

❌ **Vague**:
```
Build a calculator
```

✅ **Specific**:
```
Implement the MedalCalculator class per PR-003 spec:

- Constructor takes medalDatabase and userProfile
- evaluateMedal(medalId) returns { medalId, status, details }
- Status is one of: 'unlocked', 'achievable', 'locked'
- Check prerequisites first, then requirements
- Cache results for performance

Here's the full code structure:
[PASTE CODE FROM SPEC]

Make sure tests in tests/calculator.test.js pass.
```

### Breaking it Down

If a PR is too large:

```
Start with just the data models:
- Medal class
- UserProfile class  
- Achievement class

Don't implement MedalCalculator yet.
Create tests/medals.test.js with just model tests.
```

Then in next prompt:
```
Now implement MedalCalculator class using the models we just created.

Here's the structure:
[PASTE CALCULATOR CODE FROM SPEC]
```

### If Aider Gets Stuck

Provide clear failure examples:

```
The test is failing:

Test: "marks bronze as achievable with 3 gold series"
Expected: status === 'achievable'
Actual: status === 'locked'

The profile has 3 gold series achievements with:
- year: 2025
- weaponGroup: 'A'
- points: 35, 36, 37

The medal requirements are:
[PASTE MEDAL JSON]

Why is it returning 'locked'?
```

---

## Validation Checklist

After completing each PR, verify all items:

### After PR-001
- [ ] medals.json contains 10+ medal types
- [ ] All medal prerequisites reference existing medals
- [ ] All medal unlocks reference existing medals  
- [ ] Point thresholds: A ≤ B ≤ C (lower is harder)
- [ ] All tests pass
- [ ] Medal database loads without errors

### After PR-002
- [ ] Can create and save profile
- [ ] Can load saved profile (no data loss)
- [ ] Can add/remove achievements
- [ ] Export generates valid JSON
- [ ] Import parses JSON correctly
- [ ] Validation prevents invalid profiles
- [ ] All tests pass

### After PR-003
- [ ] Bronze medal shows 'achievable' with 3 gold series
- [ ] Silver requires bronze prerequisite
- [ ] Locked medals show reason (prerequisites/requirements)
- [ ] Time windows enforced
- [ ] Weapon group thresholds enforced
- [ ] Cache working (results reused)
- [ ] All tests pass

### After PR-004
- [ ] App loads at http://localhost:8000
- [ ] Navigation between views works
- [ ] Header shows current view
- [ ] Profile selector displays profiles
- [ ] Home view shows welcome message
- [ ] All views render without errors
- [ ] Mobile responsive (test in DevTools)
- [ ] Keyboard navigation works (Tab through elements)
- [ ] All tests pass

---

## File Structure After All 4 PRs

```
medal-app/
├── index.html
├── package.json
├── README.md
├── css/
│   ├── style.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── main.js
│   ├── app.js
│   ├── data/
│   │   ├── data-manager.js
│   │   ├── storage.js
│   │   └── models.js
│   ├── logic/
│   │   ├── calculator.js
│   │   ├── validator.js
│   │   └── exporter.js
│   └── ui/
│       ├── router.js
│       ├── views/
│       │   ├── home.js
│       │   ├── skill-tree.js
│       │   ├── list-view.js
│       │   └── settings.js
│       └── components/
│           ├── header.js
│           └── profile-selector.js
├── data/
│   └── medals.json
├── tests/
│   ├── medals.test.js
│   ├── storage.test.js
│   ├── exporter.test.js
│   ├── calculator.test.js
│   ├── validator.test.js
│   └── router.test.js
└── docs/
    ├── 01-Product-Vision.md
    ├── 02-Data-Model.md
    ├── 03-Interaction-Design.md
    ├── 04-Visual-Design.md
    ├── 05-Technical-Architecture.md
    ├── 06-Summary-NextSteps.md
    ├── 07-Medal-Database-Reference.md
    └── QUICK-REFERENCE.md
```

---

## Running the App

### Development Server

```bash
npm run dev

# Open http://localhost:8000 in browser
```

### Running Tests

```bash
# All tests
npm test

# Single test file
npm test tests/medals.test.js

# Watch mode (auto-rerun on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Debugging

Open browser DevTools (F12) and:
- Check Console for errors
- Use debugger: `debugger;` in code
- Watch localStorage: Application → Local Storage

---

## After Phase 1 (All 4 PRs Complete)

You'll have:
✅ Working SPA with 4 views
✅ Complete medal database
✅ User profile management
✅ Medal calculation engine
✅ Mobile responsive design
✅ Comprehensive tests
✅ Production-ready architecture

Next steps:
- Phase 2 PRs (Canvas, Forms, Filters)
- User testing
- Performance optimization
- Deploy to web

---

## Getting Help

**If Aider generates incorrect code:**
1. Show it the test failure
2. Paste relevant code from the PR spec
3. Ask: "Why doesn't this match the spec?"

**If you're confused about requirements:**
1. Read the test cases first - they explain expectations
2. Check the design document section referenced
3. Look at code samples in the PR spec

**If tests fail mysteriously:**
1. Run test in isolation: `npm test -- --testNamePattern="test name"`
2. Add console.log statements to understand what's happening
3. Compare to the code sample in the spec

---

**Ready to start? Begin with PR-001 and follow the sequence. Good luck! 🚀**
