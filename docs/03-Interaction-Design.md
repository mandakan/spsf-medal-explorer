# Medal Skill-Tree Explorer App
## Interaction Design & User Experience

---

## Information Architecture

```
App Root
├── Home / Welcome Screen
├── Medal Explorer
│   ├── Skill-Tree Canvas View (Default)
│   │   ├── Pan/Zoom Controls
│   │   ├── Medal Nodes (Clickable)
│   │   └── Connection Lines (Dependencies)
│   └── List View (Alternative)
│       ├── Filter Panel
│       ├── Medal Cards
│       └── Sort Options
├── Achievement Input
│   ├── Quick Add Achievement
│   ├── Batch Import
│   └── Achievement History
├── Profile & Settings
│   ├── User Profile Info
│   ├── Weapon Group Selection
│   ├── Data Management
│   └── Export/Import
└── Help & Tutorial
```

---

## Core Views

### 1. Home / Welcome Screen

**Purpose**: Onboard users, set up initial profile, explain the app

**Key Elements**:
- **Hero section**: App title, brief explanation with game analogy
  - "Explore medals like a skill tree in your favorite game"
  - Striking visual showing interconnected medals
- **Call-to-action buttons**:
  - "New Profile" (primary)
  - "Load Profile" (secondary)
  - "View Demo" (tertiary)
- **Quick facts**:
  - "10+ medal types"
  - "Track multi-year progression"
  - "Discover achievable medals"

**Interactions**:
- Click "New Profile" → Quick Setup wizard
- Click "Load Profile" → File picker or profile selector
- Click "View Demo" → Sample data loaded, cannonball-proof mode

### 2. Skill-Tree Canvas View (PRIMARY)

**Purpose**: Visualize medal dependencies like Civilization tech tree

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [← Back] Medal Skill-Tree [List View] [Settings] [?]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ╔═════════╗                ╔═════════╗               │
│  ║ Bronze  ║───────────────→║ Silver  ║               │
│  ║ Pistol  ║                ║ Pistol  ║               │
│  ║ (Gold)  ║                ║(Achieve)║               │
│  ╚═════════╝                ╚═════════╝               │
│       ↓                           ↓                     │
│  ╔═════════╗      ╔═════════╗  ╔═════════╗            │
│  ║ Elite   ║      ║ Field   ║  ║ Gold    ║            │
│  ║ Bronze  ║      ║ Mark    ║  ║ Pistol  ║            │
│  ║(Locked) ║      ║(Locked) ║  ║(Locked) ║            │
│  ╚═════════╝      ╚═════════╝  ╚═════════╝            │
│                                                         │
│                                                         │
│ [Pan/Zoom Controls]  [Reset View]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

[Right Sidebar - Medal Details]
╔══════════════════════════════╗
║ Pistol Mark - Silver         ║
║ ══════════════════════════════║
║                              ║
║ Status: ACHIEVABLE ✓         ║
║                              ║
║ Prerequisites:               ║
║ ☑ Bronze Pistol Mark        ║
║                              ║
║ Requirements:                ║
║ ○ Gold series ≥38 pts (2025) ║
║   Current: 42 pts ✓          ║
║                              ║
║ [Get Details] [Track It]     ║
╚══════════════════════════════╝
```

**Visual Design**:

**Medal Nodes**:
- **Shape**: Circle or hexagon
- **Size**: Medium (40-60px on desktop)
- **Color coding**:
  - Unlocked: Gold/bright color, filled
  - Achievable: Highlighted, pulsing glow, different hue
  - Locked: Gray/dim, 50% opacity
- **Text**: Medal tier abbreviation (B/S/G/S1/S2/S3)

**Connections**:
- **Solid line**: Direct prerequisite relationship
- **Dotted line**: Alternative paths / OR relationships
- **Direction**: Top to bottom or left to right (hierarchical)

**Interactions**:

| Action | Behavior |
|--------|----------|
| **Click medal node** | Sidebar opens showing full medal details |
| **Hover medal node** | Tooltip shows medal name, brief status |
| **Double-click medal** | Opens full detail modal (mobile) |
| **Drag canvas** | Pan view across medals |
| **Pinch/scroll** | Zoom in/out (mobile-friendly) |
| **Swipe left/right** | Navigate between medal categories |
| **Tap "Reset View"** | Auto-fit all medals in viewport |

**Responsive Behavior**:
- **Desktop (1024px+)**:
  - Full canvas on left (70%)
  - Detail sidebar on right (30%)
  - Zoom to 100%
- **Tablet (768-1024px)**:
  - Full-width canvas
  - Detail sidebar below/overlay
  - Zoom to 80%
- **Mobile (<768px)**:
  - Full-width canvas (swipeable)
  - Detail modal on top (dismissible)
  - Zoom default to fit screen
  - Single-column layout

### 3. List View

**Purpose**: Browse medals in traditional table format, filter/sort

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [← Back] Medal List [Skill-Tree] [Settings]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Filters:                                                │
│ ┌─ Medal Type ─┐  ┌─ Tier ─┐  ┌─ Status ────────┐    │
│ │ All (10)     │  │ All    │  │ ○ All            │    │
│ │ Pistol Mark  │  │ Bronze │  │ ○ Unlocked       │    │
│ │ Elite Mark   │  │ Silver │  │ ● Achievable     │    │
│ │ Field Mark   │  │ Gold   │  │ ○ Locked         │    │
│ │ ...          │  │ ...    │  └──────────────────┘    │
│ └──────────────┘  └────────┘  [Reset Filters]         │
│                                                         │
│ Sort by: [Name ▼] [Difficulty ▼] [Status ▼]          │
│                                                         │
│ Results: 12 medals                                      │
│                                                         │
│ ╭──────────────────────────────────────────────────┮   │
│ │ PISTOL MARKS                                     │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Bronze Pistol Mark           │ ✓ Unlocked 2025  │   │
│ │ Intro: Prov 3 serier vs...   │ Achieved: Jan 15 │   │
│ │                              │ [See Details]    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Silver Pistol Mark           │ ♦ Achievable     │   │
│ │ Requires: Bronze + 1 gold    │ Gold series: 2/1 │   │
│ │                              │ [See Details]    │   │
│ ├──────────────────────────────────────────────────┤   │
│ │ Gold Pistol Mark             │ ○ Locked         │   │
│ │ Requires: Silver + time      │ Need Silver first │   │
│ │                              │ [See Details]    │   │
│ ╰──────────────────────────────────────────────────╯   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interactions**:
- **Click filter**: Toggles filter, live-updates list
- **Click sort**: Changes sort order, list reorders
- **Click medal card**: Opens medal detail view
- **Status indicator click**: Shows detailed breakdown

### 4. Medal Detail View (Modal/Page)

**Purpose**: Show comprehensive medal information and requirements

**Layout**:
```
╔════════════════════════════════════════════════════════╗
║         MEDAL: PISTOL MARK - SILVER                    ║
║                                                        ║
║ Status: ACHIEVABLE ✓  (Last updated: 2 hours ago)     ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ DESCRIPTION                                            ║
║ Award for consistent excellence in precision shooting. ║
║ Part of the core pistol shooter progression path.      ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ PREREQUISITES (All must be met)                        ║
║ ☑ Bronze Pistol Mark achieved                         ║
║   Achieved: Jan 15, 2025                              ║
║   [View achievement]                                   ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ REQUIREMENTS (For this calendar year: 2025)            ║
║                                                        ║
║ Achievement 1 of 1:                                    ║
║ ○ Gold Series Result in Weapon Group A/B/C:           ║
║   • Weapon Group A: Minimum 38 points                 ║
║     Current: 42 points ✓ (Club Championship, Jun 15)  ║
║   • Weapon Group B: Minimum 39 points                 ║
║     Current: None                                      ║
║   • Weapon Group C: Minimum 45 points                 ║
║     Current: None                                      ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ NEXT MEDAL                                             ║
║ Gold Pistol Mark                                       ║
║ Status: LOCKED (Need Silver first)                    ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ TIMELINE                                               ║
║ Pistol Mark progression (typical):                     ║
║ Year 1: Achieve Bronze                                 ║
║ Year 2: Achieve Silver                                 ║
║ Year 3+: Achieve Gold, then Stars                      ║
║                                                        ║
║ ─────────────────────────────────────────────────────  ║
║                                                        ║
║ [Track Achievement] [Share] [Help] [Close]            ║
╚════════════════════════════════════════════════════════╝
```

**Sections**:
1. **Title & Status indicator**
2. **Description**: What this medal is for
3. **Prerequisites**: What you need before this
4. **Requirements**: What you need for THIS medal
   - Broken down by category (gold series, competition results, etc.)
   - Shows what you have vs. what you need
   - Links to edit/add achievements
5. **Next in chain**: What this unlocks
6. **Timeline**: Typical progression if applicable
7. **Action buttons**

---

## Achievement Input Flows

### Flow 1: Quick Add Single Achievement

**Triggered**: User clicks "+" button in nav, or "Add Achievement" from anywhere

**Steps**:
1. **Modal opens**: "Add Achievement"
2. **Question**: "What did you achieve?"
   - Buttons: "Gold Series" | "Competition Result" | "Standard Medal"
3. **If Gold Series selected**:
   ```
   ┌──────────────────────────────┐
   │ Gold Series Result            │
   ├──────────────────────────────┤
   │ Year: [2025 ▼]               │
   │ Weapon Group: [A ▼]          │
   │ Points: [42 ____]            │
   │ Date: [Jun 15, 2025]         │
   │ Competition: [Club ...]      │
   │ Notes: [_________________]   │
   │                              │
   │ [Cancel] [Save]              │
   └──────────────────────────────┘
   ```
4. **Validation**:
   - Points within acceptable range
   - Year not in future
   - Required fields filled
5. **On Save**: Achievement added, medals recalculated, view updates
6. **User sees**: "Achievement saved! 1 new medal now achievable"

### Flow 2: Batch Import

**Triggered**: User clicks "Import" in settings

**Steps**:
1. **File picker**: "Choose JSON file to import"
2. **File uploaded**: Validation occurs
3. **If valid**: Preview modal shows:
   - Number of achievements to import
   - List of achievements
   - Any conflicts (duplicate dates/competitions)
4. **Options**:
   - "Import all" (merge)
   - "Replace all" (overwrite)
   - "Cancel"
5. **On completion**: "Imported 15 achievements successfully"

### Flow 3: Achievement History

**Purpose**: Review, edit, delete entered achievements

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Achievement History                                     │
├─────────────────────────────────────────────────────────┤
│ [▼ All Years] [Filter by Type] [Sort: Newest]         │
│                                                         │
│ 2025                                                    │
│ ├─ Jun 15: Gold Series (Group A, 42 pts)              │
│ │  Club Championship                                   │
│ │  [Edit] [Delete]                                     │
│ ├─ Jul 20: Competition Result (National, Silver)      │
│ │  Swedish Championship                                │
│ │  [Edit] [Delete]                                     │
│ └─ Jan 15: Medal Unlock (Bronze Pistol Mark)         │
│    [Edit] [Delete]                                     │
│                                                         │
│ 2024                                                    │
│ ├─ Dec 10: Gold Series (Group A, 39 pts)              │
│ │  Regional Finals                                     │
│ │  [Edit] [Delete]                                     │
│ └─ Oct 22: Gold Series (Group B, 35 pts)              │
│    Club Training                                       │
│    [Edit] [Delete]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interactions**:
- Click "[Edit]": Open edit modal, same form as add
- Click "[Delete]": Confirm dialog, then delete
- Filter/sort options change what's displayed

---

## Data Management Views

### Profile Settings

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Profile Settings                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ YOUR PROFILE                                            │
│ Display Name: [Anna Skytteson ____________]            │
│ Weapon Group: [A ▼] (used in recommendations)         │
│ Email: [optional, for features]                        │
│ Notifications: [Toggle ON/OFF]                         │
│                                                         │
│ DATA MANAGEMENT                                         │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ Your data is stored locally in your browser.           │
│ No information is sent to our servers (POC phase).     │
│                                                         │
│ [Export Data]   → Save all your data as JSON          │
│ [Import Data]   → Load saved JSON file                 │
│ [Clear Data]    → Delete all local data (confirm)     │
│ [Download Backup] → Save to computer                  │
│                                                         │
│ PRIVACY                                                 │
│ [ ] Share usage stats (helps us improve)              │
│                                                         │
│ Version: 1.0.0                                          │
│ Last backup: Dec 20, 2025, 7:32 AM                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Export Dialog

**Flow**:
1. Click "[Export Data]"
2. Modal shows options:
   ```
   ┌──────────────────────────────────┐
   │ Export Your Data                 │
   ├──────────────────────────────────┤
   │ Select format:                   │
   │ ○ JSON (complete backup)         │
   │ ● JSON (achievements only)       │
   │ ○ CSV (for spreadsheet)          │
   │ ○ PDF (for printing)             │
   │                                  │
   │ Include:                         │
   │ ☑ Achievements                   │
   │ ☑ Unlocked medals               │
   │ ☑ User profile                  │
   │                                  │
   │ [Cancel] [Export]                │
   └──────────────────────────────────┘
   ```
3. File downloads automatically
4. Confirmation: "Data exported successfully"

---

## Mobile-Specific Interactions

### Touch Gestures

| Gesture | Action |
|---------|--------|
| **Tap** | Select/toggle, open menu |
| **Long press** | Context menu on medal |
| **Swipe left** | Next view/page |
| **Swipe right** | Previous view/page |
| **Pinch zoom** | Zoom in/out on canvas |
| **Two-finger pan** | Pan canvas across screen |

### Mobile Layout Adaptations

- **Stack vertically**: Content reflows to single column
- **Full-width cards**: Medal cards span full width
- **Bottom sheet**: Achievement modals slide up from bottom
- **Sticky header**: Top nav stays fixed while scrolling
- **Large touch targets**: Buttons ≥44px tall/wide
- **Simplified filters**: Collapsed by default, expand on tap

---

## Accessibility Features

### Keyboard Navigation

- **Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons, open modals
- **Arrow keys**: 
  - In list: move up/down between items
  - In canvas: pan view
- **Escape**: Close modals, dialogs
- **Home/End**: Jump to start/end of list

### Screen Reader Support

- **ARIA labels** on all interactive elements
- **Semantic HTML**: `<button>`, `<nav>`, `<main>`, etc.
- **Status announcements**: "Medal unlocked", "Achievement saved"
- **Alt text**: Medal images have descriptions
- **List structure**: Logical heading hierarchy

### Visual Accessibility

- **Color contrast**: WCAG AA standard (4.5:1 text)
- **Focus indicators**: Visible on all interactive elements
- **Color independence**: Don't rely on color alone (use icons + color)
- **Text sizing**: Responsive, supports browser zoom
- **High contrast mode**: Works with system settings

---

## Help & Onboarding

### Contextual Help

- **Inline hints**: "Gold series from year matches medal year" (icon + tooltip)
- **"?" buttons**: Open detailed explanation
- **Guided tour**: Optional first-time walkthrough
  - Step 1: "This is the skill tree - medals are like game techs"
  - Step 2: "Click a medal to see what it needs"
  - Step 3: "Enter your achievements here"
  - Step 4: "Watch medals unlock as you progress"

### Tutorial / Video

- **First launch**: Option to watch 90-second intro video
- **In-app help**: Expandable "How it works" section
- **FAQ**: Common questions answered

---

## Error Handling & Validation Feedback

### Input Validation

| Scenario | Feedback |
|----------|----------|
| **Points out of range** | 🔴 "Points must be 0-50" (inline error) |
| **Future date** | 🔴 "Date cannot be in the future" |
| **Duplicate entry** | 🟡 "Similar achievement found, import anyway?" |
| **Missing field** | 🔴 Field highlighted in red, message shown |
| **Invalid file** | 🔴 "Invalid JSON format" with error details |

### Success States

- ✅ "Achievement saved successfully"
- ✅ "Profile updated"
- ✅ "Data exported" (with filename)
- ✅ "1 new medal unlocked!" (with notification)

---

## Animation & Micro-interactions

### Medal Node Animations

- **Unlock animation**: Medal node pulses gold, pops
- **Hover**: Subtle scale increase (1.1x), shadow enhancement
- **Click**: Quick shrink-expand (press/release feedback)

### Canvas Transitions

- **Pan**: Smooth continuous scroll
- **Zoom**: Animated transition to target zoom level
- **View switch**: Fade between skill-tree and list (400ms)

### Achievement Entry

- **Form validation**: Real-time feedback, smooth field highlighting
- **Save**: Form slides up, list below updates instantly

---

## Performance Considerations

- **Lazy loading**: Don't render off-screen medal nodes
- **Debounce**: Pan/zoom events (60fps target)
- **Canvas optimization**: Use requestAnimationFrame for animations
- **Data updates**: Only recalculate affected medals
