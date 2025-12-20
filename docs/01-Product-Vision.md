# Medal Skill-Tree Explorer App
## Product Vision & Overview

### Vision Statement
Create an engaging, game-inspired web app that helps Swedish pistol shooting enthusiasts understand and track their progress through the complex medal achievement system, visualizing medal hierarchies as an interactive skill-tree similar to RPG games like Civilization.

---

## Problem Statement

**Current Challenges:**
1. **Complexity**: The SHB medal system has 10+ medal types (Pistol Mark, Elite Mark, Field Mark, Skis Shooting Mark, Spring Running Mark, Precision Mark, Championship Mark, etc.) with multiple tiers (Bronze, Silver, Gold, Stars, Ornaments)
2. **Interdependencies**: Medals have complex prerequisite chains:
   - Bronze Pistol Mark → Silver Pistol Mark → Gold Pistol Mark → Higher tier marks
   - Some marks require previous marks + competition results from specific years
   - Different weapon groups (A, B, C, R) have different point requirements
3. **Time-based Progression**: Many marks require achievements across 3-5 year periods
4. **Hidden Paths**: Unclear what next achievable medals are based on current status
5. **Manual Tracking**: Users manually track progress or use spreadsheets

---

## Solution Overview

### Core Features

#### 1. **Medal Skill-Tree Visualization (Canvas View)**
- **Interactive canvas** where users scroll/pan to explore medal connections
- **Visual dependency graph** showing which medals unlock which others
- **Color-coded by difficulty/tier**: Bronze → Silver → Gold progression
- **Clickable medals** to see detailed requirements
- **Highlighting**: Show achievable medals based on user's current progress
- **Zoom & pan controls** for mobile-first experience

#### 2. **Medal List View**
- **Tabular or card-based view** of all medals
- **Filter/sort by**:
  - Medal type (Pistol, Elite, Field, etc.)
  - Tier (Bronze, Silver, Gold, Stars)
  - Weapon group (A, B, C, R)
  - Achievement status (unlocked, achievable, locked)
- **Quick access** to detailed medal information
- **Sort by prerequisites** to show progression paths

#### 3. **Prerequisite Input**
- **Manual input form** for user achievements:
  - Gold series results (year, score, weapon group)
  - Competition results (championship, national, regional/landsdels, crewmate/krets)
  - Dates and scores
  - Weapon group classification
- **Input validation** against SHB rules
- **Visual confirmation** of entered data

#### 4. **Medal Achievement Calculator**
- **Automatic calculation** of unlocked medals based on input
- **Display achievable medals** (those that can be earned next)
- **Show progress toward medals** (e.g., "2 of 3 required competition results at Silver level")
- **Year-based tracking** (some medals require achievement in specific calendar years)

#### 5. **Visualization Types**

**Canvas-like skill tree** (primary view):
- Nodes represent medals
- Edges show prerequisite relationships
- Visual feedback for:
  - Locked medals (gray/dim)
  - Achievable medals (highlighted, different color)
  - Unlocked medals (bright, filled)
  - Current focus (medal details sidebar)

**List view** (secondary view):
- Organized by medal type and tier
- Shows achievement status for each
- Click to see full details and requirements

#### 6. **Data Management**
- **Local storage** (IndexedDB via localStorage abstraction)
  - User prerequisites
  - Unlocked medal status
  - Input history
- **Import/Export**
  - JSON export of all user data
  - JSON import to restore data
  - CSV export of achievement status
- **Backend-ready architecture**:
  - Modular data layer (easy to swap localStorage for API calls)
  - Clean separation between UI and data logic

---

## User Flows

### Primary User Flow: New User
1. User visits app
2. Selects "Start New Profile"
3. Enters current status:
   - Which Pistol Mark tier achieved
   - Weapon group preference
   - Competition results from previous years
4. System auto-calculates unlocked medals
5. User explores Medal Skill-Tree to understand next goals
6. User sees:
   - Which medals are achievable now
   - What they need to work on for other medals
   - Timeline to reach higher tiers

### Secondary User Flow: Track Progress
1. User returns to app
2. Loads saved profile
3. Enters new competition results
4. System recalculates unlocked medals
5. User sees:
   - New medals unlocked
   - New achievable medals
   - Progress bars toward future goals

---

## Scope: POC (Proof of Concept)

### Included in POC
- ✅ Canvas-like visualization with manual scrolling
- ✅ List view of medals
- ✅ Manual prerequisite input
- ✅ Local storage persistence
- ✅ Import/Export functionality
- ✅ Basic medal calculation engine
- ✅ Mobile-first responsive design
- ✅ Modular code architecture

### Not Included (Future Phases)
- ❌ Backend API integration (designed for, but not implemented)
- ❌ User accounts & cloud sync
- ❌ Real-time competition data from SHB
- ❌ Social features (leaderboards, sharing)
- ❌ Advanced filtering/analytics
- ❌ Achievement notifications

---

## Technical Approach

### Frontend Stack
- **Framework**: Vanilla JavaScript (no framework dependency in POC)
- **Visualization**: Canvas API or SVG for skill-tree
- **Storage**: localStorage + JSON serialization
- **Architecture**: 
  - **Data Layer**: Medal database, user progress state
  - **Business Logic**: Achievement calculator, requirement checker
  - **UI Layer**: Views (canvas, list), components
  - **Modular design**: Easy to replace storage with backend API

### Key Design Principles
1. **Modularity**: Each concern separated (data, logic, UI)
2. **Backend-agnostic**: Storage layer abstracts data source
3. **Mobile-first**: Responsive design for all screen sizes
4. **Progressive disclosure**: Show complexity gradually
5. **Clear feedback**: Users always know their status and next steps

---

## Success Criteria

### User Experience
- [ ] Users can understand medal system within 2 minutes
- [ ] Finding achievable medals takes <30 seconds
- [ ] Entering prerequisites takes <3 minutes
- [ ] Skill-tree visualization is clear and navigable on mobile

### Technical
- [ ] All medal data from Bilaga 1 accurately represented
- [ ] Medal calculation engine passes 100% of test cases
- [ ] No data loss on browser refresh/close
- [ ] Import/export maintains 100% data fidelity

### Engagement
- [ ] Users save their profile (confirms value)
- [ ] Clear motivation to return (progression, next goals)
- [ ] Shareable visualization (export image option)

---

## Next Steps
1. Review and iterate on this vision document
2. Create detailed Data Model document
3. Create Interaction Design document
4. Create Visual Design specification
5. Create Technical Architecture document
