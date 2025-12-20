# PR Roadmap: Medal Skill-Tree Explorer Implementation

## Overview

This document outlines the initial PR sequence to get the Medal Skill-Tree Explorer app from zero to a working MVP. Each PR builds on the previous ones and references specific design documents for implementation guidance.

**Total estimated effort for all 4 PRs: 4-6 weeks for an experienced developer**

---

## Phase 1: Foundation (PRs 1-4)

These PRs establish all foundational systems needed for the app to function.

### PR-001: Project Setup & Medal Database ⭐ **START HERE**

**What**: Initialize project structure and load all SHB medal data from regulations  
**Why**: Establish single source of truth for all medal information  
**Design docs**: 02-Data-Model.md, 07-Medal-Database-Reference.md  
**Files**: 10 files (structure, models, test data)  
**Effort**: 2-3 days  

**After this PR:**
- Complete medal database loaded and validated
- Medal object model working
- All data accessible via MedalDatabase class
- Foundation for calculator and UI

**Pre-requisites**: None

---

### PR-002: Data Layer & Storage System

**What**: Implement persistent storage with localStorage and modular DataManager interface  
**Why**: Enable user profiles to be created, saved, loaded, and exported  
**Design docs**: 02-Data-Model.md (Storage Schema section), 05-Technical-Architecture.md (Data Layer)  
**Files**: 5 files (interfaces, implementation, tests)  
**Effort**: 3-4 days  
**Depends on**: PR-001

**After this PR:**
- User profiles can be created and saved
- Import/export functionality working
- Storage validates data before saving
- Architecture ready for API integration later

**Key classes**:
- `DataManager` (abstract interface)
- `LocalStorageDataManager` (implementation)
- `DataExporter` (import/export)

---

### PR-003: Medal Achievement Calculator

**What**: Core calculation engine determining medal status (unlocked/achievable/locked)  
**Why**: Calculate which medals user has earned and which are within reach  
**Design docs**: 02-Data-Model.md (Calculation Engine), 07-Medal-Database-Reference.md, 05-Technical-Architecture.md  
**Files**: 4 files (calculator, validator, tests)  
**Effort**: 5-7 days (most complex logic)  
**Depends on**: PR-001, PR-002

**After this PR:**
- Medal status evaluated correctly
- Gold series requirements enforced
- Prerequisite chains validated
- Star progression rules applied
- 95%+ test coverage

**Key classes**:
- `MedalCalculator` (main logic)
- `InputValidator` (input validation)

---

### PR-004: Basic UI Shell & Views Structure

**What**: Foundational UI with router, navigation, and view scaffolds  
**Why**: Provide framework for remaining UI PRs to build upon  
**Design docs**: 03-Interaction-Design.md (Views), 04-Visual-Design.md (Design System), 05-Technical-Architecture.md (UI Layer)  
**Files**: 11 files (router, views, components, styles, tests)  
**Effort**: 4-5 days  
**Depends on**: PR-001, PR-002, PR-003

**After this PR:**
- Single-page app navigation working
- All 4 main views (Home, Skill-Tree, List, Settings) scaffolded
- Profile selector functional
- Base CSS with design system
- Mobile-responsive foundation
- Keyboard accessible

**Key classes**:
- `AppRouter` (SPA navigation)
- `Header`, `ProfileSelector` (components)
- `HomeView`, `SkillTreeView`, `ListViewView`, `SettingsView` (views)

---

## Phase 2: Core Features (PRs 5-7)

Ready after Phase 1 completes. These implement the main user-facing features.

### PR-005: Skill-Tree Canvas Visualization

**What**: Interactive canvas-based visualization of medal relationships  
**Why**: Core value proposition - game-like exploration of medal progression  
**Design docs**: 03-Interaction-Design.md (Skill-Tree Canvas View), 04-Visual-Design.md (Canvas Layout)  
**Depends on**: PR-001 through PR-004  

---

### PR-006: Achievement Input & Medal Unlock Logic

**What**: Form to log achievements and auto-calculate medal unlocks  
**Why**: Enable users to track their progress and see results immediately  
**Design docs**: 03-Interaction-Design.md (Achievement Input Flow), 04-Visual-Design.md (Form Components)  
**Depends on**: PR-001 through PR-004  

---

### PR-007: Medal List View with Filters & Search

**What**: Traditional table/list view with filtering and sorting  
**Why**: Alternative view for users who prefer browsing over visualization  
**Design docs**: 03-Interaction-Design.md (List View), 04-Visual-Design.md (Table Components)  
**Depends on**: PR-001 through PR-004  

---

## PR Dependency Graph

```
PR-001 (Medal DB)
    ↓
    ├─→ PR-002 (Storage)
    │   ↓
    │   ├─→ PR-003 (Calculator)
    │   │
    │   └─→ PR-003 (Calculator)
    │       ↓
    │       └─→ PR-004 (UI Shell)
    │           ├─→ PR-005 (Canvas)
    │           ├─→ PR-006 (Achievement Input)
    │           └─→ PR-007 (List View)
    │
    └─→ PR-002 (Storage)
```

---

## How to Use These PR Specs

### For Code Generation (Aider/Claude)

Copy each PR spec into your coding assistant:

```bash
# Terminal 1: Start Aider
aider .

# In Aider:
# Copy PR-001 content
# Type: "Implement PR-001"

# After PR-001 passes tests, continue with PR-002
```

Each PR is self-contained with:
- ✅ Exact file structure to create
- ✅ Complete code samples (not pseudocode)
- ✅ Test cases to verify correctness
- ✅ Design document references
- ✅ Acceptance criteria checklist

### For Code Review

Use the PR descriptions to verify:
- All acceptance criteria met
- All test cases passing
- Code follows architecture patterns
- No dependencies on future PRs

### For Planning

Reference the dependency graph to:
- Understand PR sequencing
- Know what's blocking what
- Plan parallel work (though unlikely with small team)
- Track progress

---

## What You'll Have After Phase 1

After completing all 4 PRs:

✅ **A working single-page app** with:
- Complete medal database (10+ medal types with all tiers)
- User profile management (create, save, load, export)
- Medal calculation engine (unlocked/achievable/locked)
- Basic UI with 4 views (Home, Skill-Tree, List, Settings)
- Storage with localStorage persistence
- Comprehensive test coverage
- Mobile-responsive design
- Keyboard accessible
- Zero external dependencies

✅ **Fully testable foundation** for Phase 2:
- Canvas visualization (PR-005)
- Achievement input forms (PR-006)
- Advanced filtering/search (PR-007)

✅ **Production-ready architecture**:
- Modular design (easy to swap components)
- Testable (comprehensive test suite)
- Extensible (path to API backend documented)
- Accessible (WCAG AA compliance)
- Fast (no external dependencies)

---

## Estimated Timeline

| Phase | PRs | Effort | Timeline |
|-------|-----|--------|----------|
| **Foundation** | 1-4 | 14-19 days | Week 1-2 |
| **Core Features** | 5-7 | 10-15 days | Week 3-4 |
| **Polish/Launch** | 8-10 | 5-10 days | Week 5 |
| | | **29-44 days** | **~6 weeks** |

**Notes:**
- Estimates assume mid-level developer experience with vanilla JS
- Parallel work possible only on design/UX
- QA and user testing happens continuously
- Buffer included for debugging and refactoring

---

## Success Criteria

### After PR-004 (MVP Ready)
- [ ] All 4 PRs merged and tested
- [ ] App loads in browser without errors
- [ ] Can create profile, add achievement, see unlocked medals
- [ ] All acceptance criteria met
- [ ] Mobile responsive on phones/tablets
- [ ] Keyboard navigation working
- [ ] No console warnings/errors

### After PR-007 (Feature Complete)
- [ ] All user workflows complete
- [ ] Canvas visualization working
- [ ] Achievement input form working
- [ ] Filter/search working
- [ ] 90%+ test coverage
- [ ] Ready for beta user testing

### Before Launch
- [ ] User testing feedback incorporated
- [ ] Performance optimized (target: <1s first paint)
- [ ] Accessibility audit complete
- [ ] Documentation complete
- [ ] Backup/recovery tested

---

## Design Document Cross-References

Each PR references specific sections of your design docs:

| PR | Key Documents | Sections |
|----|---|---|
| **PR-001** | 02-Data-Model.md, 07-Medal-Database | Medal Object, Data Structure |
| **PR-002** | 02-Data-Model.md, 05-Technical-Architecture | Storage Schema, Data Layer |
| **PR-003** | 02-Data-Model.md, 05-Technical-Architecture, 07-Medal-Database | Calculation Engine, Point Thresholds |
| **PR-004** | 03-Interaction-Design.md, 04-Visual-Design.md, 05-Technical-Architecture | Views, Components, UI Layer |
| **PR-005** | 03-Interaction-Design.md, 04-Visual-Design.md | Skill-Tree Canvas |
| **PR-006** | 03-Interaction-Design.md, 04-Visual-Design.md | Achievement Input |
| **PR-007** | 03-Interaction-Design.md, 04-Visual-Design.md | List View |

---

## Common Issues & Solutions

### Issue: "Tests fail because of X dependency"
**Solution**: Each PR spec is complete and self-contained. If tests fail, the code generation didn't follow the spec exactly. Review the "FILES TO CREATE" and "CODE STRUCTURE" sections.

### Issue: "I don't understand the medal system"
**Solution**: Read 07-Medal-Database-Reference.md first - it explains all medal types, thresholds, and rules. This is essential before implementing PR-001.

### Issue: "Design docs contradict the PR spec"
**Solution**: PR specs take precedence. They're extracted from and consistent with design docs but optimized for implementation. If you find a genuine contradiction, document it for next iteration.

### Issue: "The calculator logic is complex"
**Solution**: This is intentional - PR-003 is the most complex because it contains all business logic. The test cases cover edge cases. Use them as specification for correctness.

### Issue: "I want to skip PR-X to work on PR-Y"
**Solution**: Don't. Dependency graph shows why. Even if you think you can skip PR-002 storage, you'd be duplicating work later. Follow the sequence.

---

## Next Steps

1. **Choose your pace**:
   - Aggressive: 1 PR per week (4 weeks total)
   - Moderate: 1 PR every 1.5 weeks (6 weeks total)
   - Relaxed: 1 PR per 2 weeks (8 weeks total)

2. **Set up your environment**:
   - Clone/init repository
   - Install Node.js and npm
   - Run: `npm install` (if package.json exists)
   - Run: `npm test` to verify setup

3. **Start with PR-001**:
   - Copy PR-001 spec into your code assistant
   - Follow the FILES TO CREATE section exactly
   - Run tests: `npm test -- tests/medals.test.js`
   - Merge to main when all tests pass

4. **Proceed in sequence**:
   - Once PR-001 passes, start PR-002
   - Each PR references previous ones
   - No skipping - dependencies matter

5. **Track progress**:
   - Use a project board (GitHub, Trello, etc.)
   - Mark PRs as In Progress → Review → Done
   - Celebrate milestones (each PR is a win!)

---

## Questions?

- **Design questions**: Check the design documents (especially 02-Data-Model.md and 03-Interaction-Design.md)
- **Implementation questions**: Review the code samples in each PR spec
- **Medal system questions**: See 07-Medal-Database-Reference.md
- **Architecture questions**: See 05-Technical-Architecture.md

---

**Ready to build something awesome? Start with PR-001! 🚀**

Questions or need clarification? Ask before starting - it's better to clarify now than debug later.
