# PR-003: Medal Achievement Calculator

## DESCRIPTION
Implement the core calculation engine that determines which medals are unlocked, achievable, or locked based on user achievements. This is the brain of the app that translates user input into medal status (per 02-Data-Model.md Calculation Engine and 05-Technical-Architecture.md MedalCalculator section).

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System

## ACCEPTANCE CRITERIA
- [ ] MedalCalculator evaluates all three medal statuses (unlocked, achievable, locked)
- [ ] Gold series requirements checked correctly per weapon group thresholds
- [ ] Time-window requirements enforced (same calendar year, multi-year windows)
- [ ] Prerequisite chains validated correctly
- [ ] Star progression rules applied (3-year holding requirements)
- [ ] Calculator caches results for performance
- [ ] Comprehensive test coverage including edge cases
- [ ] Code follows 05-Technical-Architecture.md MedalCalculator design
- [ ] Results match expected outcomes from test cases in 07-Medal-Database-Reference.md

## FILES TO CREATE
- js/logic/calculator.js (MedalCalculator class)
- js/logic/validator.js (InputValidator for achievement rules)
- tests/calculator.test.js (medal evaluation tests)
- tests/validator.test.js (input validation tests)

## CODE STRUCTURE

### js/logic/calculator.js

```javascript
/**
 * Evaluates medal status based on user achievements
 * Per 02-Data-Model.md Calculation Engine section
 */
class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase;
    this.profile = userProfile;
    this.statusCache = new Map(); // Cache for performance
  }
  
  /**
   * Evaluate a single medal's status
   * @returns {Object} { medalId, status, details }
   */
  evaluateMedal(medalId) {
    // Check cache first
    if (this.statusCache.has(medalId)) {
      return this.statusCache.get(medalId);
    }
    
    const medal = this.medals.getMedalById(medalId);
    if (!medal) {
      throw new Error(`Medal not found: ${medalId}`);
    }
    
    // Check if already unlocked
    if (this.hasUnlockedMedal(medalId)) {
      const result = {
        medalId,
        status: 'unlocked',
        unlockedDate: this.getUnlockedDate(medalId),
        details: {}
      };
      this.statusCache.set(medalId, result);
      return result;
    }
    
    // Check prerequisites
    const prereqsCheck = this.checkPrerequisites(medal);
    if (!prereqsCheck.allMet) {
      const result = {
        medalId,
        status: 'locked',
        reason: 'prerequisites_not_met',
        details: prereqsCheck
      };
      this.statusCache.set(medalId, result);
      return result;
    }
    
    // Check requirements
    const reqsCheck = this.checkRequirements(medal);
    if (!reqsCheck.allMet) {
      const result = {
        medalId,
        status: 'locked',
        reason: 'requirements_not_met',
        details: reqsCheck
      };
      this.statusCache.set(medalId, result);
      return result;
    }
    
    // If all prerequisites and requirements met
    const result = {
      medalId,
      status: 'achievable',
      details: reqsCheck
    };
    this.statusCache.set(medalId, result);
    return result;
  }
  
  /**
   * Check if medal is already unlocked
   */
  hasUnlockedMedal(medalId) {
    return this.profile.unlockedMedals?.some(m => m.medalId === medalId) || false;
  }
  
  /**
   * Get date medal was unlocked
   */
  getUnlockedDate(medalId) {
    const unlocked = this.profile.unlockedMedals?.find(m => m.medalId === medalId);
    return unlocked ? unlocked.unlockedDate : null;
  }
  
  /**
   * Check all prerequisites for a medal
   * @returns {Object} { allMet: boolean, items: [...], missingItems: [...] }
   */
  checkPrerequisites(medal) {
    if (!medal.prerequisites || medal.prerequisites.length === 0) {
      return { allMet: true, items: [], missingItems: [] };
    }
    
    const items = [];
    const missingItems = [];
    
    medal.prerequisites.forEach(prereq => {
      if (prereq.type === 'medal') {
        const isMet = this.hasUnlockedMedal(prereq.medalId);
        const item = {
          type: 'medal',
          medalId: prereq.medalId,
          isMet,
          achieved: isMet ? this.getUnlockedDate(prereq.medalId) : null,
          description: prereq.description
        };
        items.push(item);
        if (!isMet) missingItems.push(item);
      } else if (prereq.type === 'age_requirement') {
        const item = {
          type: 'age_requirement',
          isMet: true, // Assume met for now
          minAge: prereq.minAge,
          description: prereq.description
        };
        items.push(item);
      }
    });
    
    return {
      allMet: missingItems.length === 0,
      items,
      missingItems
    };
  }
  
  /**
   * Check all requirements for a medal
   * @returns {Object} { allMet: boolean, items: [...], progress: {...} }
   */
  checkRequirements(medal) {
    if (!medal.requirements || medal.requirements.length === 0) {
      return { allMet: true, items: [] };
    }
    
    const items = [];
    
    medal.requirements.forEach((req, idx) => {
      if (req.type === 'gold_series') {
        items.push(this.checkGoldSeriesRequirement(req, idx));
      } else if (req.type === 'competition_result') {
        items.push(this.checkCompetitionRequirement(req, idx));
      } else if (req.type === 'sustained_achievement') {
        items.push(this.checkSustainedAchievementRequirement(req, idx));
      }
    });
    
    return {
      allMet: items.every(item => item.isMet),
      items,
      progress: this.calculateOverallProgress(items)
    };
  }
  
  /**
   * Check gold series requirement
   * Per 07-Medal-Database-Reference.md gold series specifications
   */
  checkGoldSeriesRequirement(req, index) {
    const achievements = this.profile.prerequisites.filter(a => a.type === 'gold_series');
    
    let met = false;
    let progress = { current: 0, required: req.minAchievements || 1 };
    let matchingAchievements = [];
    
    // Filter by time window if specified
    let filtered = achievements;
    if (req.timeWindowYears) {
      const currentYear = new Date().getFullYear();
      const windowStart = currentYear - req.timeWindowYears + 1;
      filtered = achievements.filter(a => a.year >= windowStart && a.year <= currentYear);
    }
    
    // Filter by weapon group if applicable
    if (req.weaponGroupsA || req.weaponGroupsB || req.weaponGroupsC) {
      // Check which weapon groups have sufficient points
      const groupA = filtered.filter(a => a.weaponGroup === 'A' && a.points >= (req.weaponGroupsA?.min || 0));
      const groupB = filtered.filter(a => a.weaponGroup === 'B' && a.points >= (req.weaponGroupsB?.min || 0));
      const groupC = filtered.filter(a => a.weaponGroup === 'C' && a.points >= (req.weaponGroupsC?.min || 0));
      
      // Use highest achieving group
      matchingAchievements = [
        ...groupA.slice(0, req.minAchievements),
        ...groupB.slice(0, req.minAchievements),
        ...groupC.slice(0, req.minAchievements)
      ].slice(0, req.minAchievements);
    } else {
      matchingAchievements = filtered.slice(0, req.minAchievements);
    }
    
    progress.current = matchingAchievements.length;
    met = progress.current >= progress.required;
    
    return {
      type: 'gold_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      achievements: matchingAchievements,
      pointThresholds: {
        A: req.weaponGroupsA?.min,
        B: req.weaponGroupsB?.min,
        C: req.weaponGroupsC?.min
      }
    };
  }
  
  /**
   * Check competition result requirement
   */
  checkCompetitionRequirement(req, index) {
    const achievements = this.profile.prerequisites.filter(a => a.type === 'competition_result');
    
    let met = false;
    let progress = { current: 0, required: req.minAchievements || 1 };
    
    // Filter by competition type and medal tier
    const filtered = achievements.filter(a => {
      const typeMatch = !req.competitionType || a.competitionType === req.competitionType;
      const tierMatch = !req.medalTier || a.medalType === req.medalTier;
      return typeMatch && tierMatch;
    });
    
    // Apply time window
    let timeFiltered = filtered;
    if (req.timeWindowYears) {
      const currentYear = new Date().getFullYear();
      const windowStart = currentYear - req.timeWindowYears + 1;
      timeFiltered = filtered.filter(a => a.year >= windowStart && a.year <= currentYear);
    }
    
    progress.current = timeFiltered.length;
    met = progress.current >= progress.required;
    
    return {
      type: 'competition_result',
      index,
      isMet: met,
      progress,
      description: req.description,
      competitionType: req.competitionType,
      medalTier: req.medalTier,
      achievements: timeFiltered
    };
  }
  
  /**
   * Check sustained achievement requirement (for stars)
   * Requires maintaining a tier for multiple years
   */
  checkSustainedAchievementRequirement(req, index) {
    // Count years of achievement at required level
    const yearsAchieved = new Set();
    
    this.profile.prerequisites.forEach(a => {
      if (a.type === 'gold_series') {
        const pointThreshold = req.minPointsPerYear || 0;
        if (a.points >= pointThreshold) {
          yearsAchieved.add(a.year);
        }
      }
    });
    
    const currentCount = yearsAchieved.size;
    const required = req.yearsOfAchievement || 3;
    const met = currentCount >= required;
    
    return {
      type: 'sustained_achievement',
      index,
      isMet: met,
      progress: { current: currentCount, required },
      description: req.description,
      yearsOfAchievement: req.yearsOfAchievement || 3
    };
  }
  
  /**
   * Get all achievable medals based on current status
   * @returns {Array} Array of medal objects that are currently achievable
   */
  getAchievableMedals() {
    return this.medals.medals
      .map(medal => this.evaluateMedal(medal.id))
      .filter(result => result.status === 'achievable')
      .map(result => this.medals.getMedalById(result.medalId));
  }
  
  /**
   * Get all unlocked medals
   */
  getUnlockedMedals() {
    return this.profile.unlockedMedals || [];
  }
  
  /**
   * Evaluate all medals and return organized results
   */
  evaluateAllMedals() {
    const allMedals = this.medals.medals.map(m => m.id);
    
    return {
      unlocked: allMedals
        .map(id => this.evaluateMedal(id))
        .filter(r => r.status === 'unlocked'),
      achievable: allMedals
        .map(id => this.evaluateMedal(id))
        .filter(r => r.status === 'achievable'),
      locked: allMedals
        .map(id => this.evaluateMedal(id))
        .filter(r => r.status === 'locked')
    };
  }
  
  /**
   * Clear cache (call when achievements change)
   */
  invalidateCache() {
    this.statusCache.clear();
  }
  
  /**
   * Helper: Calculate overall progress
   */
  calculateOverallProgress(requirementItems) {
    let totalCurrent = 0;
    let totalRequired = 0;
    
    requirementItems.forEach(item => {
      if (item.progress) {
        totalCurrent += item.progress.current;
        totalRequired += item.progress.required;
      }
    });
    
    return {
      current: totalCurrent,
      required: totalRequired,
      percentage: totalRequired > 0 ? (totalCurrent / totalRequired) * 100 : 0
    };
  }
}
```

### js/logic/validator.js

Input validation for achievements:

```javascript
/**
 * Validates user inputs against SHB rules
 */
class InputValidator {
  /**
   * Validate gold series input
   */
  static validateGoldSeriesInput(input) {
    const errors = [];
    const currentYear = new Date().getFullYear();
    
    // Year validation
    if (!input.year) {
      errors.push('Year is required');
    } else if (input.year < 2000 || input.year > currentYear) {
      errors.push(`Year must be between 2000 and ${currentYear}`);
    }
    
    // Weapon group validation
    if (!['A', 'B', 'C', 'R'].includes(input.weaponGroup)) {
      errors.push('Invalid weapon group. Must be A, B, C, or R.');
    }
    
    // Points validation
    if (input.points === undefined || input.points === null) {
      errors.push('Points are required');
    } else if (input.points < 0 || input.points > 50) {
      errors.push('Points must be between 0 and 50');
    }
    
    // Date validation
    if (input.date && new Date(input.date) > new Date()) {
      errors.push('Date cannot be in the future');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate competition result input
   */
  static validateCompetitionResultInput(input) {
    const errors = [];
    const currentYear = new Date().getFullYear();
    const validTypes = ['national', 'regional/landsdels', 'crewmate/krets', 'championship'];
    const validTiers = ['bronze', 'silver', 'gold'];
    
    // Year validation
    if (!input.year || input.year < 2000 || input.year > currentYear) {
      errors.push(`Year must be between 2000 and ${currentYear}`);
    }
    
    // Competition type validation
    if (!validTypes.includes(input.competitionType)) {
      errors.push(`Invalid competition type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Medal tier validation
    if (!validTiers.includes(input.medalType)) {
      errors.push(`Invalid medal tier. Must be one of: ${validTiers.join(', ')}`);
    }
    
    // Date validation
    if (input.date && new Date(input.date) > new Date()) {
      errors.push('Date cannot be in the future');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate points against weapon group thresholds
   */
  static validatePointsForWeaponGroup(points, weaponGroup, medalTier) {
    const thresholds = {
      bronze: { A: 32, B: 33, C: 34 },
      silver: { A: 38, B: 39, C: 45 },
      gold: { A: 43, B: 44, C: 46 }
    };
    
    const tierThresholds = thresholds[medalTier];
    if (!tierThresholds) return { isValid: false, message: 'Unknown medal tier' };
    
    const required = tierThresholds[weaponGroup];
    if (points >= required) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      message: `${weaponGroup} group requires ${required} points, you have ${points}`
    };
  }
}
```

### tests/calculator.test.js

Comprehensive calculator tests:

```javascript
describe('MedalCalculator', () => {
  let calculator;
  let medalDb;
  let profile;
  
  beforeEach(() => {
    // Mock medal database
    medalDb = {
      getMedalById: jest.fn((id) => {
        const medals = {
          'pistol-mark-bronze': new Medal({
            id: 'pistol-mark-bronze',
            type: 'pistol_mark',
            tier: 'bronze',
            displayName: 'Pistol Mark - Bronze',
            prerequisites: [],
            requirements: [{
              type: 'gold_series',
              minAchievements: 3,
              timeWindowYears: 1,
              weaponGroupsA: { min: 32 },
              weaponGroupsB: { min: 33 },
              weaponGroupsC: { min: 34 }
            }]
          }),
          'pistol-mark-silver': new Medal({
            id: 'pistol-mark-silver',
            type: 'pistol_mark',
            tier: 'silver',
            displayName: 'Pistol Mark - Silver',
            prerequisites: [{ type: 'medal', medalId: 'pistol-mark-bronze' }],
            requirements: [{
              type: 'gold_series',
              minAchievements: 1,
              timeWindowYears: 1,
              weaponGroupsA: { min: 38 }
            }]
          })
        };
        return medals[id];
      }),
      medals: []
    };
    
    profile = new UserProfile({
      userId: 'user-1',
      displayName: 'Test User',
      unlockedMedals: [],
      prerequisites: []
    });
    
    calculator = new MedalCalculator(medalDb, profile);
  });
  
  test('marks bronze as achievable with 3 gold series', () => {
    const currentYear = new Date().getFullYear();
    profile.prerequisites = [
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 35,
        date: '2025-06-15'
      }),
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 36,
        date: '2025-06-20'
      }),
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 37,
        date: '2025-06-25'
      })
    ];
    
    const result = calculator.evaluateMedal('pistol-mark-bronze');
    expect(result.status).toBe('achievable');
  });
  
  test('marks silver as locked when bronze not unlocked', () => {
    const result = calculator.evaluateMedal('pistol-mark-silver');
    expect(result.status).toBe('locked');
    expect(result.reason).toBe('prerequisites_not_met');
  });
  
  test('marks silver as achievable when bronze unlocked and requirements met', () => {
    profile.unlockedMedals = [{ medalId: 'pistol-mark-bronze', unlockedDate: '2025-01-15', year: 2025 }];
    const currentYear = new Date().getFullYear();
    profile.prerequisites = [
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 40,
        date: '2025-06-15'
      })
    ];
    
    calculator.invalidateCache();
    const result = calculator.evaluateMedal('pistol-mark-silver');
    expect(result.status).toBe('achievable');
  });
  
  test('returns unlocked status for already achieved medal', () => {
    profile.unlockedMedals = [{ medalId: 'pistol-mark-bronze', unlockedDate: '2025-01-15', year: 2025 }];
    
    const result = calculator.evaluateMedal('pistol-mark-bronze');
    expect(result.status).toBe('unlocked');
    expect(result.unlockedDate).toBe('2025-01-15');
  });
  
  test('caches medal status for performance', () => {
    calculator.evaluateMedal('pistol-mark-bronze');
    expect(calculator.statusCache.has('pistol-mark-bronze')).toBe(true);
  });
  
  test('invalidates cache when achievements change', () => {
    calculator.evaluateMedal('pistol-mark-bronze');
    calculator.invalidateCache();
    expect(calculator.statusCache.size).toBe(0);
  });
});

describe('InputValidator', () => {
  test('accepts valid gold series input', () => {
    const input = {
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15'
    };
    const result = InputValidator.validateGoldSeriesInput(input);
    expect(result.isValid).toBe(true);
  });
  
  test('rejects future date', () => {
    const input = {
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2099-06-15'
    };
    const result = InputValidator.validateGoldSeriesInput(input);
    expect(result.isValid).toBe(false);
  });
  
  test('rejects invalid weapon group', () => {
    const input = {
      year: 2025,
      weaponGroup: 'X',
      points: 42
    };
    const result = InputValidator.validateGoldSeriesInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('weapon group');
  });
  
  test('rejects out-of-range points', () => {
    const input = {
      year: 2025,
      weaponGroup: 'A',
      points: 75
    };
    const result = InputValidator.validateGoldSeriesInput(input);
    expect(result.isValid).toBe(false);
  });
});
```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Calculation Engine section
- **07-Medal-Database-Reference.md** - Point thresholds and requirement specifications for each medal type
- **05-Technical-Architecture.md** - MedalCalculator module design

## EDGE CASES COVERED
- Multiple achievements in same year
- Achievements spanning time windows
- Different weapon groups with different point requirements
- Star progression requiring 3-year holds
- Prerequisite chains (Bronze → Silver → Gold)

## PERFORMANCE NOTES
- Results cached per medal to avoid recalculation
- Cache invalidated when profile changes
- O(n) complexity for single medal evaluation (n = achievements)
- O(m) for all medals (m = medal count, typically <100)

## DONE WHEN
- All medal evaluations return correct status
- Time window requirements enforced
- Weapon group thresholds applied correctly
- Prerequisite chains work
- Star progression calculated properly
- All test cases pass
- Cache working correctly
- No console errors or warnings
