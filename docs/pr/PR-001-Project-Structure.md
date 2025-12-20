# PR-001: Project Setup & Medal Database

## DESCRIPTION
Initialize the project structure, set up the medal database from SHB regulations, and create the foundational data models. This establishes the single source of truth for all medal data and enables testing of the calculation engine in subsequent PRs.

## DEPENDENCIES
- None (first PR in Phase 1)

## ACCEPTANCE CRITERIA
- [ ] Project directory structure matches layout in CONTRIBUTING.md
- [ ] All 10+ SHB medal types loaded from medals.json
- [ ] Medal objects conform to schema in 02-Data-Model.md (Medal Object section)
- [ ] All prerequisite relationships correctly encoded
- [ ] All weapon group point thresholds match 07-Medal-Database-Reference.md
- [ ] Time-window requirements properly documented in each medal
- [ ] Unit tests verify medal data structure and relationships
- [ ] No hardcoded medal data in JavaScript files

## FILES TO CREATE
- index.html (basic scaffold)
- css/style.css (empty, structure only)
- css/components.css (empty, structure only)
- css/responsive.css (empty, structure only)
- js/main.js (empty, will initialize app)
- js/app.js (empty, main controller)
- data/medals.json (complete medal database)
- js/data/models.js (Medal, Profile, Achievement classes)
- package.json (project metadata)
- tests/medals.test.js (validate medal database)

## CODE STRUCTURE

### data/medals.json
Structure per 02-Data-Model.md:
```json
{
  "version": "1.0",
  "medals": [
    {
      "id": "pistol-mark-bronze",
      "type": "pistol_mark",
      "tier": "bronze",
      "name": "Pistolskyttemärket - Brons",
      "displayName": "Pistol Mark - Bronze",
      "color": "#CD7F32",
      "icon": "medal-bronze",
      
      "prerequisites": [],
      
      "requirements": [
        {
          "type": "gold_series",
          "description": "3 precision series",
          "minAchievements": 3,
          "timeWindowYears": 1,
          "pointThresholds": {
            "A": { "min": 32 },
            "B": { "min": 33 },
            "C": { "min": 34 }
          }
        }
      ],
      
      "unlocksFollowingMedals": [
        "pistol-mark-silver",
        "elite-mark-bronze",
        "field-mark-bronze"
      ],
      
      "yearIntroduced": 2000,
      "sortOrder": 1
    },
    // ... more medals
  ]
}
```

Complete list from 07-Medal-Database-Reference.md:
- Pistolskyttemärket (Pistol Mark) - all tiers and stars
- Elitmärket (Elite Mark) - all tiers
- Fältskyttemärket (Field Mark) - all tiers
- Mästarmerket (Championship Mark) - all tiers
- Precisionsskyttemärket (Precision Mark) - all tiers
- Skidskyttemärket (Skis Mark) - all tiers
- Springskyttemärket (Spring Running Mark) - all tiers
- Märke i Nationell Helmatch (National Full Match Mark) - all tiers

### js/data/models.js

Implement classes:

```javascript
/**
 * Represents a single medal
 */
class Medal {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.tier = data.tier;
    this.name = data.name;
    this.displayName = data.displayName;
    this.color = data.color;
    this.icon = data.icon;
    this.prerequisites = data.prerequisites || [];
    this.requirements = data.requirements || [];
    this.unlocksFollowingMedals = data.unlocksFollowingMedals || [];
    this.description = data.description || '';
    this.yearIntroduced = data.yearIntroduced;
    this.sortOrder = data.sortOrder;
  }
}

/**
 * Represents a user's profile and achievements
 */
class UserProfile {
  constructor(data) {
    this.userId = data.userId;
    this.displayName = data.displayName;
    this.createdDate = data.createdDate || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
    this.weaponGroupPreference = data.weaponGroupPreference || 'A';
    this.unlockedMedals = data.unlockedMedals || [];
    this.prerequisites = data.prerequisites || [];
  }
}

/**
 * Represents a single achievement (gold series, competition result, etc.)
 */
class Achievement {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // 'gold_series', 'competition_result', etc.
    this.year = data.year;
    this.weaponGroup = data.weaponGroup;
    this.points = data.points;
    this.date = data.date;
    this.competitionName = data.competitionName || '';
    this.notes = data.notes || '';
  }
}

/**
 * Medal database manager
 */
class MedalDatabase {
  constructor(medalDataJson) {
    this.medals = medalDataJson.medals.map(m => new Medal(m));
  }
  
  getMedalById(medalId) {
    return this.medals.find(m => m.id === medalId);
  }
  
  getMedalsByType(type) {
    return this.medals.filter(m => m.type === type);
  }
  
  getMedalsByTier(tier) {
    return this.medals.filter(m => m.tier === tier);
  }
}
```

### package.json
```json
{
  "name": "medal-skill-tree-explorer",
  "version": "0.1.0",
  "description": "Interactive skill-tree explorer for SHB medal achievements",
  "main": "index.html",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "dev": "python -m http.server 8000"
  },
  "keywords": ["shooting", "medals", "skill-tree", "swe"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

### index.html (Scaffold)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medal Skill-Tree Explorer</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
  <div id="app-root"></div>
  
  <script src="js/data/models.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### tests/medals.test.js

Test cases:

```javascript
describe('Medal Database', () => {
  let medalDb;
  
  beforeEach(async () => {
    const response = await fetch('data/medals.json');
    const data = await response.json();
    medalDb = new MedalDatabase(data);
  });
  
  test('loads all medals successfully', () => {
    expect(medalDb.medals.length).toBeGreaterThan(10);
  });
  
  test('finds medal by id', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(medal).toBeDefined();
    expect(medal.displayName).toBe('Pistol Mark - Bronze');
  });
  
  test('bronze pistol mark has no prerequisites', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(medal.prerequisites.length).toBe(0);
  });
  
  test('silver pistol mark requires bronze', () => {
    const medal = medalDb.getMedalById('pistol-mark-silver');
    expect(medal.prerequisites.some(p => p.medalId === 'pistol-mark-bronze')).toBe(true);
  });
  
  test('gold series requirement has correct point thresholds', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    const goldSeriesReq = medal.requirements.find(r => r.type === 'gold_series');
    expect(goldSeriesReq.pointThresholds.A.min).toBe(32);
    expect(goldSeriesReq.pointThresholds.B.min).toBe(33);
    expect(goldSeriesReq.pointThresholds.C.min).toBe(34);
  });
  
  test('medals unlock following medals correctly', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze');
    expect(medal.unlocksFollowingMedals).toContain('pistol-mark-silver');
    expect(medal.unlocksFollowingMedals).toContain('elite-mark-bronze');
  });
});

describe('Achievement Class', () => {
  test('creates achievement with required fields', () => {
    const achievement = new Achievement({
      id: 'a1',
      type: 'gold_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    });
    expect(achievement.year).toBe(2025);
    expect(achievement.weaponGroup).toBe('A');
  });
});
```

## DATA INTEGRITY CHECKS

Medal data must pass validation:

- [ ] All medal IDs are unique
- [ ] All medal types match known types (pistol_mark, elite_mark, field_mark, etc.)
- [ ] All tiers are valid (bronze, silver, gold, star_1, star_2, star_3)
- [ ] All prerequisite medalIds reference existing medals
- [ ] All unlocksFollowingMedals reference existing medals
- [ ] Point thresholds: A ≤ B ≤ C (lower requirement for easier group)
- [ ] Time windows are positive numbers
- [ ] No circular dependencies in prerequisites

Create a validation script:
```javascript
function validateMedalDatabase(medals) {
  const errors = [];
  const medalIds = new Set(medals.map(m => m.id));
  
  medals.forEach(medal => {
    // Check prerequisites exist
    medal.prerequisites.forEach(prereq => {
      if (prereq.type === 'medal' && !medalIds.has(prereq.medalId)) {
        errors.push(`Medal ${medal.id}: prerequisite ${prereq.medalId} not found`);
      }
    });
    
    // Check unlocks exist
    medal.unlocksFollowingMedals.forEach(unlockId => {
      if (!medalIds.has(unlockId)) {
        errors.push(`Medal ${medal.id}: unlock ${unlockId} not found`);
      }
    });
  });
  
  return errors;
}
```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Medal Object structure and relationships
- **07-Medal-Database-Reference.md** - All SHB medal specifications and data mapping

## DONE WHEN
- All files created with correct structure
- medals.json loads without errors
- MedalDatabase class instantiates and queries work
- All test cases pass
- No validation errors in medal data
- Project can be served locally (python -m http.server 8000)

## NOTES
- The medal database is the single source of truth; no hardcoding elsewhere
- Future PRs (calculator, UI) will reference this database
- Keep medals.json human-readable (pretty-print JSON with 2-space indent)
- Add comments in medals.json for complex medals (e.g., star progression rules)
