# Medal Skill-Tree Explorer App
## Complete Design Documentation

---

## Status: historical design docs

The documents in this folder are the original product/design/architecture specifications created early in the project.
They are kept for historical context and to capture the initial intent, but they may not reflect the current implementation.

For up-to-date behavior and architecture, prefer:
- the repository root `README.md`
- the source code in `src/` (especially `src/logic/`, `src/contexts/`, and `src/utils/`)
- tests in `tests/`

---

## 📋 What You Have

A comprehensive set of **7 design documents** that form a complete product specification for building a mobile-first web app to explore and track Swedish shooting association (SHB) medal achievements.

### Document List

1. **01-Product-Vision.md** - Problem statement, vision, features, scope
2. **02-Data-Model.md** - Data structures, storage architecture, calculation engine
3. **03-Interaction-Design.md** - User flows, views, interactions, accessibility
4. **04-Visual-Design.md** - Colors, typography, components, responsive design
5. **05-Technical-Architecture.md** - Technology stack, modules, implementation guide
6. **06-Summary-NextSteps.md** - Design decisions, roadmap, success metrics
7. **07-Medal-Database-Reference.md** - SHB medal system mapping, data examples

---

## 🎯 Key Concepts

### The App

A **game-inspired skill-tree explorer** that:
- Visualizes complex medal dependencies like Civilization tech tree
- Helps users understand SHB medal system
- Tracks achievements manually inputted by users
- Auto-calculates which medals are achievable
- Shows progression paths clearly

### Main Views

1. **Skill-Tree Canvas** (Primary) - Interactive graph visualization with pan/zoom
2. **Medal List** (Alternative) - Traditional table with filters/sorts
3. **Medal Details** (Modal) - Full requirements and status for each medal
4. **Achievement Input** - Forms to log competition results and achievements
5. **Settings** - Profile management, import/export, data backup

### Core Features

✅ Canvas-like skill-tree visualization
✅ List view with filtering
✅ Achievement calculation engine  
✅ Manual prerequisite input
✅ Local storage (POC)
✅ Import/Export functionality
✅ Mobile-first responsive design
✅ Modular, backend-ready architecture

---

## 📖 How to Use These Documents

### For Understanding the Project

**Start here if you're new to the project:**
1. Read 01-Product-Vision.md (10 min) - Understand the problem and solution
2. Skim 03-Interaction-Design.md sections 1-2 (10 min) - See what the app looks like
3. Read 06-Summary-NextSteps.md (15 min) - Understand decisions and next steps

**Time investment**: ~35 minutes

### For Design Review

**Before iteration/feedback:**
1. Read all 7 documents (~2 hours)
2. Annotate questions and concerns
3. Schedule review meeting
4. Discuss design decisions and trade-offs
5. Update documents based on feedback

**Time investment**: ~3 hours

### For Implementation

**Use as reference during coding:**
- **Data Layer**: 02-Data-Model.md + 07-Medal-Database-Reference.md
- **Component Development**: 04-Visual-Design.md
- **Logic Layer**: 05-Technical-Architecture.md sections 3-4
- **Integration**: 03-Interaction-Design.md sections 7-8
- **Testing**: 05-Technical-Architecture.md section on testing

**Keep open**: 02-Data-Model.md, 05-Technical-Architecture.md, 04-Visual-Design.md

**Time investment**: Ongoing reference, 20-30 min per session

### For Prototyping/Design

**Create high-fidelity mockups:**
1. Use 03-Interaction-Design.md layouts as wireframe basis
2. Apply 04-Visual-Design.md specifications
3. Build interactive prototype with Figma/Adobe XD
4. Validate with users before engineering

**Time investment**: ~5-10 hours for clickable prototype

### For Quality Assurance

**Testing checklist:**
1. Review 07-Medal-Database-Reference.md - Verify all medals present
2. Check 06-Summary-NextSteps.md success criteria
3. Test flows from 03-Interaction-Design.md
4. Validate responsive design from 04-Visual-Design.md
5. Check accessibility standards

**Time investment**: ~2-3 hours QA per feature

---

## 🎨 Design Philosophy

### Key Principles

1. **Game-Inspired** - Borrow visual language from strategy games (Civilization, Age of Empires)
2. **Clear Hierarchy** - Medal progression paths immediately obvious
3. **Mobile-First** - Responsive, touch-friendly, minimal scrolling
4. **Minimal Decoration** - Function over form, but beautiful
5. **Accessible** - WCAG AA standard, keyboard navigation, screen reader support

### Color Scheme

- **Unlocked Medals**: Bright Gold (#FFD700)
- **Achievable Medals**: Bright Teal (#20C997)
- **Locked Medals**: Cool Gray (#6C757D)
- **Primary Action**: Deep Teal (#0D6E6E)
- **Bronze/Silver/Gold**: Realistic metallic colors

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│        UI LAYER                     │
│  Views, Components, Interactions    │
├─────────────────────────────────────┤
│     APPLICATION LOGIC LAYER         │
│  Calculators, Validators, Logic     │
├─────────────────────────────────────┤
│        DATA LAYER                   │
│  StorageImpl, Models, Persistence    │
└─────────────────────────────────────┘
```

### Key Modules

- **MedalCalculator**: Evaluates medal status (unlocked/achievable/locked)
- **DataManager**: Abstract storage (localStorage now, API later)
- **InputValidator**: Validates user inputs against rules
- **Router**: Simple SPA navigation
- **EventBus**: Component communication

---

## 📊 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- Project setup, data model, basic UI shell

### Phase 2: Visualization (Weeks 4-6)  
- Skill-tree canvas, layout algorithm, interactions

### Phase 3: Achievement Tracking (Weeks 7-9)
- Input form, calculator, medal unlocking

### Phase 4: Data Management (Weeks 10-11)
- List view, import/export, settings

### Phase 5: Polish (Week 12+)
- Testing, optimization, documentation

**Total**: 12+ weeks for production-ready POC

---

## 💡 Key Design Decisions

### ✅ Game-Inspired Visualization
**Why**: Makes complex system intuitive and engaging
**Alternative Considered**: Traditional spreadsheet view
**Trade-off**: Requires more complex implementation

### ✅ Dual-View Approach  
**Why**: Caters to different user preferences
**Alternative Considered**: Single view only
**Trade-off**: Doubled view implementation effort

### ✅ Manual Input (POC)
**Why**: No external API dependency, teaches users system
**Alternative Considered**: Automated scraping from SHB
**Trade-off**: Requires user input, more accurate

### ✅ Local Storage
**Why**: POC requires zero backend, user privacy
**Alternative Considered**: Backend immediately
**Trade-off**: Limited to single device, no sync

### ✅ Vanilla JavaScript
**Why**: No framework dependency, simple deployment
**Alternative Considered**: React, Vue, etc.
**Trade-off**: More code for complex interactions

### ✅ Mobile-First Design
**Why**: Majority of users on mobile
**Alternative Considered**: Desktop-first
**Trade-off**: Some desktop features simplified

---

## ❓ Common Questions

### Q: Why game-inspired visualization?
**A**: Makes system intuitive for people familiar with tech trees (games). Also motivating - visible progression goal.

### Q: Why two views?
**A**: Different users have different mental models. Explorers like graph view, goal-seekers like checklist view. Mobile can adapt based on screen size.

### Q: Why manual input instead of automatic?
**A**: POC avoids API dependency. Users learn system better by inputting. Easy to add API later.

### Q: Why localStorage instead of backend?
**A**: POC needs zero infrastructure. User data stays private. Natural progression path to backend.

### Q: How long to implement?
**A**: 12 weeks for full POC (3 people). 8 weeks with experienced team. 16+ weeks solo developer.

### Q: Can I use framework X?
**A**: Yes! Architecture is framework-agnostic. Just replace vanilla JS with React/Vue/Svelte/etc.

### Q: What about mobile app?
**A**: Web app works mobile with responsive design. Can wrap in React Native or Flutter later for app store presence.

### Q: Can users share progress?
**A**: POC: Export/import only. Future: Social sharing, leaderboards, competition profiles.

---

## ✨ What's Special About This Design

1. **Modular Architecture** - Easy to test, maintain, and extend
2. **Backend-Ready** - Can swap localStorage for API without UI changes
3. **Game Design** - Makes learning SHB system engaging, not tedious
4. **Accessibility** - WCAG AA compliant from start
5. **Mobile-First** - Works great on phone (primary device)
6. **No Dependencies** - POC can be single HTML file
7. **User-Centered** - Solves real problem for real users

---

## 🚀 Next Steps

### Immediate (This Week)

1. **Review All Documents**
   - [ ] Read through all 7 documents
   - [ ] Add comments/questions
   - [ ] Identify any gaps

2. **Validate Medal Data**
   - [ ] Confirm all SHB medals captured
   - [ ] Verify point thresholds
   - [ ] Check time-window rules

3. **Get Stakeholder Feedback**
   - [ ] Schedule review meeting
   - [ ] Discuss design decisions
   - [ ] Identify must-haves for POC

### Short Term (Next 2 Weeks)

1. **Create Mockups**
   - [ ] Home screen
   - [ ] Skill-tree canvas (sample medals)
   - [ ] Detail modal
   - [ ] Mobile layout

2. **Build Clickable Prototype**
   - [ ] Link mockups with navigation
   - [ ] Test basic flows
   - [ ] Gather feedback

3. **Finalize Medal Database**
   - [ ] Complete comprehensive list
   - [ ] Create test cases
   - [ ] Document edge cases

4. **Begin Implementation** (optional if prototype validated)
   - [ ] Set up project structure
   - [ ] Implement data layer
   - [ ] Build basic UI

---

## 📚 Document Reference Guide

### By Role

**Product Manager**
- Start: 01-Product-Vision.md
- Then: 06-Summary-NextSteps.md
- Reference: 03-Interaction-Design.md (user flows)

**Designer**
- Start: 03-Interaction-Design.md
- Then: 04-Visual-Design.md
- Reference: 02-Data-Model.md (for context)

**Developer**
- Start: 05-Technical-Architecture.md
- Then: 02-Data-Model.md
- Reference: 07-Medal-Database-Reference.md

**QA**
- Start: 06-Summary-NextSteps.md (success criteria)
- Then: 03-Interaction-Design.md (user flows)
- Reference: 07-Medal-Database-Reference.md (test cases)

### By Task

**Understanding the System**: 01, 02, 07
**Designing UI**: 03, 04
**Building Code**: 05, 02, 07
**Testing**: 06, 03, 07
**Data Setup**: 02, 07
**Project Planning**: 01, 06

---

## 🎓 Learning Path

If you're new to the project:

1. **Day 1** (2 hours)
   - Read 01-Product-Vision.md
   - Skim 03-Interaction-Design.md sections 1-2
   - Review 06-Summary-NextSteps.md

2. **Day 2** (3 hours)
   - Deep dive: 02-Data-Model.md
   - Review: 07-Medal-Database-Reference.md
   - Understand: SHB medal system (external research)

3. **Day 3** (3 hours)
   - Study: 05-Technical-Architecture.md
   - Review: 04-Visual-Design.md
   - Plan: Implementation approach

4. **Day 4** (2 hours)
   - Full-document review
   - Ask questions
   - Ready for start

**Total**: ~10 hours to full understanding

---

## 🤝 Feedback & Iteration

These documents are **living documents** meant to evolve:

1. **Mark up changes** (use comments or track changes)
2. **Suggest alternatives** if you see better approaches
3. **Flag concerns** early (it's cheaper to redesign now)
4. **Validate with users** (especially medal requirements)
5. **Update documents** as you learn during implementation

---

## 📞 Support

**For questions about:**
- **Product vision** → See 01-Product-Vision.md or ask Product Owner
- **Data structures** → See 02-Data-Model.md or 07-Medal-Database-Reference.md
- **User flows** → See 03-Interaction-Design.md
- **UI components** → See 04-Visual-Design.md
- **Implementation** → See 05-Technical-Architecture.md
- **Project plan** → See 06-Summary-NextSteps.md

---

## ✅ Quality Checklist

Before starting implementation, confirm:

- [ ] All documents reviewed and understood
- [ ] Medal data validated against SHB handbook
- [ ] User flows approved by stakeholders
- [ ] Visual design mockups approved
- [ ] Technical approach agreed upon
- [ ] Implementation timeline confirmed
- [ ] Team roles assigned
- [ ] Success metrics defined
- [ ] Testing strategy understood

---

## 🏁 Good Luck!

You have a solid foundation. These documents represent significant analysis and design work. Use them as your north star during implementation.

**Remember**:
- Designs are guides, not rules - adapt as you learn
- User feedback beats theoretical design
- Simple implementation beats perfect design
- Ship fast, iterate often

---

**Document Created**: December 20, 2025
**Version**: 1.0
**Status**: Ready for Review

For questions or updates, contact your Product Owner or Design Lead.
