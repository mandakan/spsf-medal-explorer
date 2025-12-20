# Medal Skill-Tree Explorer App
## Data Model & Architecture

---

## Core Data Structures

### 1. Medal Object

```javascript
{
  id: "pistol-mark-silver",
  name: "Pistolskyttemärket Silber",
  type: "pistol_mark",          // Type identifier
  tier: "silver",                // bronze, silver, gold, star_1, star_2, star_3
  
  // Visual properties
  color: "#c0c0c0",
  icon: "medal-silver",
  displayName: "Pistol Mark - Silver",
  description: "Award for consistent excellence in precision shooting",
  
  // Requirements
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-bronze",
      minTierAchieved: true  // Must have achieved bronze first
    }
  ],
  
  requirements: [
    {
      type: "gold_series",
      minAchievements: 1,
      timeWindowYears: 1,  // Must be in same calendar year
      weaponGroupsA: {
        minPoints: 38,
        description: "Gold series result in weapon group A"
      },
      weaponGroupsB: {
        minPoints: 39,
        description: "Gold series result in weapon group B"
      },
      weaponGroupsC: {
        minPoints: 45,
        description: "Gold series result in weapon group C"
      }
    }
  ],
  
  // Timeline
  earliestYearAfterPrereq: 1,  // Year after prerequisite achieved
  
  // Relationships
  unlocksFollowingMedals: [
    "pistol-mark-gold",
    "elite-mark-bronze"
  ],
  
  // Additional metadata
  yearIntroduced: 2024,
  sortOrder: 1,
  isSpecialAchievement: false
}
```

### 2. User Profile Object

```javascript
{
  userId: "user-001",  // Local unique ID
  createdDate: "2025-12-20T07:32:00Z",
  lastModified: "2025-12-20T07:32:00Z",
  
  // Current achievements
  unlockedMedals: [
    {
      medalId: "pistol-mark-bronze",
      unlockedDate: "2025-01-15",
      year: 2025
    }
  ],
  
  // Competition/achievement inputs
  prerequisites: [
    {
      id: "gold-series-001",
      type: "gold_series",
      year: 2025,
      weaponGroup: "A",
      points: 42,
      date: "2025-06-15",
      competitionName: "Club Championship",
      notes: "Strong performance"
    },
    {
      id: "competition-001",
      type: "competition_result",
      year: 2025,
      competitionType: "national",  // national, regional/landsdels, crewmate/krets
      medalType: "silver",           // bronze, silver, gold
      weaponGroup: "A",
      date: "2025-07-20",
      competitionName: "Swedish Championship",
      notes: ""
    }
  ],
  
  // User preferences
  weaponGroupPreference: "A",
  displayName: "Anna Skytteson",
  notifications: true
}
```

### 3. Achievement/Prerequisite Object

```javascript
{
  id: "gold-series-001",
  type: "gold_series",  // or "competition_result", "standard_medal"
  
  // For gold_series type
  year: 2025,
  weaponGroup: "A",      // A, B, C, R
  points: 42,
  date: "2025-06-15",
  
  // For competition_result type
  competitionType: "national",  // national, regional/landsdels, crewmate/krets, championship
  medalType: "silver",           // bronze, silver, gold
  standardMedalDiscipline: "field_shooting",  // For standard medals
  
  // Common fields
  competitionName: "Club Championship",
  notes: "Optional notes",
  source: "manual_input",  // manual_input, imported, backend
  
  // Timestamps
  enteredDate: "2025-12-20T07:32:00Z",
  competitionDate: "2025-06-15"
}
```

### 4. Medal Database Schema

**Master medal list** (embedded in app as JSON):

```javascript
{
  medals: [
    // Pistol Marks (Pistolskyttemärket)
    {
      id: "pistol-mark-bronze",
      type: "pistol_mark",
      tier: "bronze",
      ...
    },
    {
      id: "pistol-mark-silver",
      type: "pistol_mark",
      tier: "silver",
      prerequisites: [{ type: "medal", medalId: "pistol-mark-bronze" }],
      ...
    },
    // Elite Marks (Elitmärket)
    // Field Marks (Fältskyttemärket)
    // Championship Marks
    // ... (10+ medal types)
  ]
}
```

---

## Data Relationships & Dependencies

### Medal Type Hierarchy

```
Pistol Mark (Base)
├─ Bronze Pistol Mark
├─ Silver Pistol Mark
│  └─ Requires: Bronze achievement
└─ Gold Pistol Mark
   └─ Requires: Silver achievement

  ├─ Gold Pistol Mark + Star 1
  │  └─ Requires: Gold + 3 years of gold-level achievement
  ├─ Gold Pistol Mark + Star 2
  │  └─ Requires: Star 1 + 3 years more
  └─ ... etc

Elite Mark (Requires: Gold Pistol Mark)
├─ Bronze Elite Mark
├─ Silver Elite Mark
└─ Gold Elite Mark
   ├─ Star 1, 2, 3
   └─ Ornament variants

Field Mark (Requires: Bronze Pistol Mark + Age 15+)
├─ Bronze Field Mark
├─ Silver Field Mark
└─ Gold Field Mark
   ├─ Star 1, 2, 3
   └─ With-Ornament variants

Championship Mark
Precision Mark
Skis Shooting Mark (Requires: Bronze Pistol Mark)
Spring Running Mark (Requires: Bronze Pistol Mark)
National Full Match Mark
```

---

## Storage Architecture

### Local Storage Structure

```javascript
// Storage key: "medal-app-data"
{
  version: "1.0",
  profiles: [
    {
      // User Profile (see above)
    }
  ],
  medals: [
    // Master medal database (loaded at app start)
  ],
  lastBackup: "2025-12-20T07:32:00Z"
}
```

### Backend-Ready Data Layer (Interface)

```javascript
/**
 * DataManager interface - works with both localStorage and backend
 */

class DataManager {
  // Read operations
  async getUserProfile(userId) {
    // Implementation: localStorage or API call
  }
  
  async getMedalDatabase() {
    // Implementation: embedded JSON or API call
  }
  
  async getAchievements(userId) {
    // Implementation: localStorage or API call
  }
  
  // Write operations
  async saveUserProfile(profile) {
    // Implementation: localStorage or API call
  }
  
  async addAchievement(userId, achievement) {
    // Implementation: localStorage or API call
  }
  
  async removeAchievement(userId, achievementId) {
    // Implementation: localStorage or API call
  }
  
  // Backup/restore
  async exportData(userId) {
    // Returns JSON of all user data
  }
  
  async importData(jsonData) {
    // Imports JSON, validates, and saves
  }
}
```

---

## Calculation Engine

### Achievement Calculator

```javascript
/**
 * Evaluates which medals are:
 * - Unlocked (user has achieved)
 * - Achievable (user can achieve with current prerequisites)
 * - Locked (not yet achievable)
 */

class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase;
    this.profile = userProfile;
  }
  
  // Check if user has unlocked a medal
  hasUnlockedMedal(medalId) {
    return this.profile.unlockedMedals.some(m => m.medalId === medalId);
  }
  
  // Evaluate all prerequisites for a medal
  evaluateMedalPrerequisites(medalId) {
    const medal = this.getMedalById(medalId);
    
    return {
      metalId: medalId,
      status: "achievable|locked|unlocked",
      prereqsMet: [],
      preqsUnmet: [
        {
          type: "medal",
          requirement: "Gold Pistol Mark",
          isMet: false,
          details: "...need to achieve Gold first"
        }
      ],
      estimatedTimeToAchieve: "3 months",
      nextSteps: [...]
    };
  }
  
  // Get all achievable medals given current status
  getAchievableMedals() {
    return this.medals.filter(medal => {
      return !this.hasUnlockedMedal(medal.id) && 
             this.checkIfAchievable(medal.id);
    });
  }
  
  // Detailed calculation for a specific requirement
  checkGoldSeriesRequirement(medal, weaponGroup) {
    // Looks through user achievements for matching gold series
    // Returns: { isMet: boolean, progress: { current, required } }
  }
  
  checkCompetitionRequirement(medal, competitionType, medalTier) {
    // Checks achievements match competition type and tier
  }
  
  checkTimeWindowRequirement(medal, timeWindow) {
    // Ensures achievements fall within specified time window (e.g., 3 years)
  }
}
```

---

## Data Validation Rules

### Input Validation

```javascript
// Gold Series Input
{
  year: {
    type: "number",
    min: 2000,
    max: new Date().getFullYear(),
    required: true
  },
  weaponGroup: {
    type: "enum",
    values: ["A", "B", "C", "R"],
    required: true
  },
  points: {
    type: "number",
    min: 0,
    max: 50,  // Assuming 50 point max
    required: true
  }
}

// Competition Result Input
{
  year: { /* similar */ },
  competitionType: {
    type: "enum",
    values: ["national", "regional/landsdels", "crewmate/krets", "championship"],
    required: true
  },
  medalType: {
    type: "enum",
    values: ["bronze", "silver", "gold"],
    required: true
  }
}
```

### Business Rule Validation

1. **Chronological**: Medal date must be after prerequisite medal date
2. **Tier progression**: Can only achieve silver if bronze achieved in previous year
3. **Time windows**: Some medals require achievements within N-year window
4. **Uniqueness**: Only one medal per tier per year (typically)
5. **Age requirement**: Some marks require user to be 15+ years old

---

## Export/Import Format

### JSON Export Structure

```json
{
  "version": "1.0",
  "exportDate": "2025-12-20T10:00:00Z",
  "profile": {
    "id": "user-123",
    "name": "John Doe",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "achievements": [
    {
      "id": "ach-001",
      "medalId": "medal-gold-100",
      "type": "competition",
      "date": "2025-12-15",
      "score": 95,
      "notes": "Championship",
      "createdAt": "2025-12-15T10:00:00Z"
    }
  ],
  "filters": [
    {
      "id": "filter-001",
      "name": "Rifle Medals",
      "criteria": { "weapon": "rifle" }
    }
  ]
}
```

### CSV Export Format

```csv
Medal,Type,Date,Score,Position,Weapon,Team,Notes,Status
Medal Name,competition,2025-12-15,95,,rifle,,Championship,unlocked
Medal Name,qualification,2025-12-14,285,,pistol,,25m qualification,achievable
```

### PDF Export

```
Medal Progress Report
────────────────────
Generated: 2025-12-20

Summary:
├─ Total Achievements: 45
├─ Unlocked Medals: 32
├─ Achievable Medals: 8
└─ Locked Medals: 5

Detailed List:
├─ Medal Name │ Type │ Date │ Score │ Status
└─ ...
```
