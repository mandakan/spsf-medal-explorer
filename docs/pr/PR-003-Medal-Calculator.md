# PR-003: Medal Achievement Calculator (React + Tailwind + Vite)

## DESCRIPTION
Implement the core calculation engine that determines which medals are unlocked, achievable, or locked based on user achievements. Integrate with React hooks for real-time medal status updates as users add achievements.

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System

## ACCEPTANCE CRITERIA
- [ ] MedalCalculator evaluates all three medal statuses (unlocked, achievable, locked)
- [ ] Gold series requirements checked correctly per weapon group thresholds
- [ ] Time-window requirements enforced
- [ ] Prerequisite chains validated correctly
- [ ] Star progression rules applied (3-year holding requirements)
- [ ] Calculator integrates with React hooks (useMemo for caching)
- [ ] Real-time updates when achievements change
- [ ] Comprehensive test coverage (95%+)
- [ ] Results match expected outcomes from 07-Medal-Database-Reference.md

## FILES TO CREATE
- src/logic/calculator.js (MedalCalculator class)
- src/logic/validator.js (InputValidator)
- src/hooks/useMedalCalculator.js (React hook for calculator)
- src/contexts/CalculatorContext.jsx (context for calculator state)
- tests/calculator.test.js (calculator tests)
- tests/validator.test.js (validator tests)

## CODE STRUCTURE

### src/logic/calculator.js

```javascript
/**
 * Evaluates medal status based on user achievements
 */
export class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase
    this.profile = userProfile
  }

  /**
   * Evaluate a single medal's status
   * @returns {Object} { medalId, status, details }
   */
  evaluateMedal(medalId) {
    const medal = this.medals.getMedalById(medalId)
    if (!medal) {
      throw new Error(`Medal not found: ${medalId}`)
    }

    // Check if already unlocked
    if (this.hasUnlockedMedal(medalId)) {
      return {
        medalId,
        status: 'unlocked',
        unlockedDate: this.getUnlockedDate(medalId),
        details: {}
      }
    }

    // Check prerequisites
    const prereqsCheck = this.checkPrerequisites(medal)
    if (!prereqsCheck.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'prerequisites_not_met',
        details: prereqsCheck
      }
    }

    // Check requirements
    const reqsCheck = this.checkRequirements(medal)
    if (!reqsCheck.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'requirements_not_met',
        details: reqsCheck
      }
    }

    return {
      medalId,
      status: 'achievable',
      details: reqsCheck
    }
  }

  hasUnlockedMedal(medalId) {
    return this.profile.unlockedMedals?.some(m => m.medalId === medalId) || false
  }

  getUnlockedDate(medalId) {
    const unlocked = this.profile.unlockedMedals?.find(m => m.medalId === medalId)
    return unlocked ? unlocked.unlockedDate : null
  }

  checkPrerequisites(medal) {
    if (!medal.prerequisites || medal.prerequisites.length === 0) {
      return { allMet: true, items: [], missingItems: [] }
    }

    const items = []
    const missingItems = []

    medal.prerequisites.forEach(prereq => {
      if (prereq.type === 'medal') {
        const isMet = this.hasUnlockedMedal(prereq.medalId)
        const item = {
          type: 'medal',
          medalId: prereq.medalId,
          isMet,
          achieved: isMet ? this.getUnlockedDate(prereq.medalId) : null,
          description: prereq.description
        }
        items.push(item)
        if (!isMet) missingItems.push(item)
      }
    })

    return {
      allMet: missingItems.length === 0,
      items,
      missingItems
    }
  }

  checkRequirements(medal) {
    if (!medal.requirements || medal.requirements.length === 0) {
      return { allMet: true, items: [] }
    }

    const items = []

    medal.requirements.forEach((req, idx) => {
      if (req.type === 'gold_series') {
        items.push(this.checkGoldSeriesRequirement(req, idx))
      }
    })

    return {
      allMet: items.every(item => item.isMet),
      items
    }
  }

  checkGoldSeriesRequirement(req, index) {
    const achievements = this.profile.prerequisites.filter(a => a.type === 'gold_series')

    let progress = { current: 0, required: req.minAchievements || 1 }
    let matchingAchievements = []

    // Filter by time window
    let filtered = achievements
    if (req.timeWindowYears) {
      const currentYear = new Date().getFullYear()
      const windowStart = currentYear - req.timeWindowYears + 1
      filtered = achievements.filter(a => a.year >= windowStart && a.year <= currentYear)
    }

    // Check against weapon group thresholds
    const grouped = this.groupByWeaponGroup(filtered, req)
    matchingAchievements = grouped.slice(0, req.minAchievements)

    progress.current = matchingAchievements.length
    const met = progress.current >= progress.required

    return {
      type: 'gold_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      pointThresholds: {
        A: req.pointThresholds?.A?.min,
        B: req.pointThresholds?.B?.min,
        C: req.pointThresholds?.C?.min
      }
    }
  }

  groupByWeaponGroup(achievements, req) {
    const threshold = {
      A: req.pointThresholds?.A?.min || 0,
      B: req.pointThresholds?.B?.min || 0,
      C: req.pointThresholds?.C?.min || 0
    }

    return achievements.filter(a => a.points >= threshold[a.weaponGroup])
  }

  evaluateAllMedals() {
    const allMedals = this.medals.getAllMedals()
    const results = {
      unlocked: [],
      achievable: [],
      locked: []
    }

    allMedals.forEach(medal => {
      const result = this.evaluateMedal(medal.id)
      results[result.status].push(result)
    })

    return results
  }
}
```

### src/logic/validator.js

```javascript
/**
 * Validates user inputs against SHB rules
 */
export class InputValidator {
  static validateGoldSeriesInput(input) {
    const errors = []
    const currentYear = new Date().getFullYear()

    if (!input.year || input.year < 2000 || input.year > currentYear) {
      errors.push(`Year must be between 2000 and ${currentYear}`)
    }

    if (!['A', 'B', 'C'].includes(input.weaponGroup)) {
      errors.push('Invalid weapon group. Must be A, B, or C.')
    }

    if (input.points === undefined || input.points < 0 || input.points > 50) {
      errors.push('Points must be between 0 and 50')
    }

    if (input.date && new Date(input.date) > new Date()) {
      errors.push('Date cannot be in the future')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

### src/hooks/useMedalCalculator.js

```javascript
import { useMemo } from 'react'
import { MedalCalculator } from '../logic/calculator'
import { useMedalDatabase } from './useMedalDatabase'
import { useProfile } from './useProfile'

/**
 * Custom hook for medal calculator
 * Memoizes results for performance
 */
export function useMedalCalculator() {
  const { medalDatabase } = useMedalDatabase()
  const { currentProfile } = useProfile()

  return useMemo(() => {
    if (!medalDatabase || !currentProfile) {
      return null
    }

    return new MedalCalculator(medalDatabase, currentProfile)
  }, [medalDatabase, currentProfile])
}

/**
 * Hook to get medal status
 */
export function useMedalStatus(medalId) {
  const calculator = useMedalCalculator()

  return useMemo(() => {
    if (!calculator) return null
    return calculator.evaluateMedal(medalId)
  }, [calculator, medalId])
}

/**
 * Hook to get all medal statuses
 */
export function useAllMedalStatuses() {
  const calculator = useMedalCalculator()

  return useMemo(() => {
    if (!calculator) return { unlocked: [], achievable: [], locked: [] }
    return calculator.evaluateAllMedals()
  }, [calculator])
}
```

### src/contexts/CalculatorContext.jsx

```jsx
import React, { createContext } from 'react'
import { useMedalCalculator, useAllMedalStatuses } from '../hooks/useMedalCalculator'

export const CalculatorContext = createContext(null)

export function CalculatorProvider({ children }) {
  const calculator = useMedalCalculator()
  const allStatuses = useAllMedalStatuses()

  return (
    <CalculatorContext.Provider value={{ calculator, allStatuses }}>
      {children}
    </CalculatorContext.Provider>
  )
}
```

### tests/calculator.test.js

```javascript
import { MedalCalculator } from '../src/logic/calculator'
import { Medal, MedalDatabase } from '../src/models/Medal'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'

describe('MedalCalculator', () => {
  let calculator, medalDb, profile

  beforeEach(() => {
    const medalData = {
      medals: [
        {
          id: 'pistol-mark-bronze',
          type: 'pistol_mark',
          tier: 'bronze',
          displayName: 'Pistol Mark - Bronze',
          prerequisites: [],
          requirements: [{
            type: 'gold_series',
            minAchievements: 3,
            timeWindowYears: 1,
            pointThresholds: {
              A: { min: 32 },
              B: { min: 33 },
              C: { min: 34 }
            }
          }]
        },
        {
          id: 'pistol-mark-silver',
          type: 'pistol_mark',
          tier: 'silver',
          displayName: 'Pistol Mark - Silver',
          prerequisites: [{ type: 'medal', medalId: 'pistol-mark-bronze' }],
          requirements: [{
            type: 'gold_series',
            minAchievements: 1,
            pointThresholds: {
              A: { min: 38 }
            }
          }]
        }
      ]
    }

    medalDb = new MedalDatabase(medalData)
    profile = new UserProfile({
      displayName: 'Test User',
      unlockedMedals: [],
      prerequisites: []
    })

    calculator = new MedalCalculator(medalDb, profile)
  })

  test('marks bronze as achievable with 3 gold series', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 35
      }),
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 36
      }),
      new Achievement({
        type: 'gold_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 37
      })
    ]

    const result = calculator.evaluateMedal('pistol-mark-bronze')
    expect(result.status).toBe('achievable')
  })

  test('marks silver as locked when bronze not unlocked', () => {
    const result = calculator.evaluateMedal('pistol-mark-silver')
    expect(result.status).toBe('locked')
    expect(result.reason).toBe('prerequisites_not_met')
  })

  test('returns unlocked status for achieved medal', () => {
    profile.unlockedMedals = [
      { medalId: 'pistol-mark-bronze', unlockedDate: '2025-01-15', year: 2025 }
    ]

    const result = calculator.evaluateMedal('pistol-mark-bronze')
    expect(result.status).toBe('unlocked')
  })
})

describe('InputValidator', () => {
  const { InputValidator } = require('../src/logic/validator')

  test('accepts valid gold series input', () => {
    const input = {
      year: 2025,
      weaponGroup: 'A',
      points: 42
    }
    const result = InputValidator.validateGoldSeriesInput(input)
    expect(result.isValid).toBe(true)
  })

  test('rejects future date', () => {
    const input = {
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2099-06-15'
    }
    const result = InputValidator.validateGoldSeriesInput(input)
    expect(result.isValid).toBe(false)
  })
})
```

## DESIGN DOCUMENT REFERENCES
- **02-Data-Model.md** - Calculation Engine section
- **07-Medal-Database-Reference.md** - Point thresholds
- **05-Technical-Architecture.md** - MedalCalculator module design

## DONE WHEN
- All medal evaluations return correct status
- Time window requirements enforced
- Weapon group thresholds applied
- React hooks working with memoization
- All test cases pass
- No console errors
