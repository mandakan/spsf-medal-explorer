import { MedalCalculator } from '../src/logic/calculator.js'

/**
 * Minimal in-memory medal "database" stub
 */
function makeDb(medals) {
  return {
    getMedalById: (id) => medals.find(m => m.id === id) || null,
    getAllMedals: () => medals.slice()
  }
}

/**
 * Helpers to craft achievements
 */
function precisionSeries(year, points, weaponGroup = 'A') {
  return { type: 'precision_series', year, points, weaponGroup }
}
function applicationSeries(year, hits, timeSeconds, weaponGroup = 'A') {
  return { type: 'application_series', year, hits, timeSeconds, weaponGroup }
}

/**
 * Build a minimal Pistol Gold medal definition (supported requirement types only)
 */
function buildPistolGold({
  precisionMin = 43,
  applicationMinHits = 6,
  applicationMaxTimeSeconds = 40
} = {}) {
  return {
    id: 'pistol-mark-gold',
    type: 'pistol_mark',
    tier: 'gold',
    prerequisites: [
      { type: 'medal', medalId: 'pistol-mark-silver', yearOffset: 1, description: 'Silver Pistol Mark (previous year or earlier)' }
    ],
    requirements: [
      {
        type: 'precision_series',
        description: '3 precision series in year',
        minAchievements: 3,
        timeWindowYears: 1,
        pointThresholds: { A: { min: precisionMin } }
      },
      {
        type: 'application_series',
        description: '3 application series in year',
        minAchievements: 3,
        timeWindowYears: 1,
        thresholds: {
          A: { minHits: applicationMinHits, maxTimeSeconds: applicationMaxTimeSeconds }
        }
      }
    ]
  }
}

/**
 * Build a "Lower Annual Mark Star 1" sustained medal referencing pistol gold
 * Requires 3 qualifying years (including current), after the previous same-type medal
 */
function buildLowerAnnualStar1() {
  return {
    id: 'lower-annual-mark-star-1',
    type: 'pistol_mark',
    tier: 'star_1',
    references: [{ medalId: 'pistol-mark-gold' }],
    prerequisites: [{ type: 'medal', medalId: 'pistol-mark-gold' }],
    requirements: [
      {
        type: 'sustained_achievement',
        description: '3 years of Gold-level Pistol Mark achievement',
        yearsOfAchievement: 3
      }
    ]
  }
}

/**
 * Build a sustained medal requiring 3-of-6 years, referencing pistol gold.
 * Constrained to current-year window end by design when references exist.
 */
function buildSustain3of6({ id, prereqMedalId }) {
  return {
    id,
    type: 'pistol_mark',
    tier: 'star_test',
    references: [{ medalId: 'pistol-mark-gold' }],
    prerequisites: [{ type: 'medal', medalId: prereqMedalId }],
    requirements: [
      {
        type: 'sustained_achievement',
        description: '3 of 6 years of Gold-level achievement (including current)',
        timeWindowYears: 6,
        yearsOfAchievement: 3
      }
    ]
  }
}

/**
 * Build a sustained medal of a different type that also references pistol gold (to prove cross-type reuse).
 */
function buildOtherTypeAnnual() {
  return {
    id: 'other-annual',
    type: 'other_mark',
    tier: 'star_1',
    references: [{ medalId: 'pistol-mark-gold' }],
    // Prereq is different type => earliestCountingYear must NOT be applied
    prerequisites: [{ type: 'medal', medalId: 'pistol-mark-gold' }],
    requirements: [
      {
        type: 'sustained_achievement',
        description: '3 qualifying years (cross-type reuse allowed)',
        yearsOfAchievement: 3
      }
    ]
  }
}

/**
 * Build an auxiliary "gold" medal with stricter application thresholds to test multi-reference "all of" semantics.
 */
function buildAuxGoldStrict() {
  return {
    id: 'aux-gold',
    type: 'other_mark',
    tier: 'gold',
    prerequisites: [],
    requirements: [
      {
        type: 'application_series',
        description: '3 application series with stricter hits/time',
        minAchievements: 3,
        timeWindowYears: 1,
        thresholds: {
          A: { minHits: 7, maxTimeSeconds: 35 } // deliberately stricter than the achievements we will supply
        }
      }
    ]
  }
}

/**
 * Build a sustained medal that references two medals (AND semantics for qualifying years).
 */
function buildDualReferenceAnnual() {
  return {
    id: 'dual-ref-annual',
    type: 'pistol_mark',
    tier: 'star_1',
    references: [{ medalId: 'pistol-mark-gold' }, { medalId: 'aux-gold' }],
    prerequisites: [{ type: 'medal', medalId: 'pistol-mark-gold' }],
    requirements: [
      {
        type: 'sustained_achievement',
        description: 'Yearly achievement of both referenced medals',
        yearsOfAchievement: 1,
        timeWindowYears: 1
      }
    ]
  }
}

describe('MedalCalculator sustained achievements (references)', () => {
  const currentYear = new Date().getFullYear()

  test('counts only years after previous same-type medal unlock and requires current year', () => {
    const pistolGold = buildPistolGold()
    const lowerAnnual = buildLowerAnnualStar1()

    const medals = [pistolGold, lowerAnnual]
    const db = makeDb(medals)

    // User unlocked pistol-mark-gold 5 years ago
    const goldUnlockYear = currentYear - 5
    const earliest = goldUnlockYear + 1 // years prior to this must be ignored for same-type sustained

    // Craft achievements:
    // - Qualifying years (>= earliest): earliest, currentYear-2, currentYear
    // - Non-qualifying (should be ignored for sustained bound): goldUnlockYear and goldUnlockYear-1
    const ach = []
    // Helper to add 3 precision + 3 app series that pass pistol gold thresholds for a given year
    const addPassingYear = (y) => {
      ach.push(
        precisionSeries(y, 50), precisionSeries(y, 50), precisionSeries(y, 50),
        applicationSeries(y, 6, 30), applicationSeries(y, 6, 30), applicationSeries(y, 6, 30)
      )
    }
    const addPassingYearPreBound = (y) => addPassingYear(y)

    // Before bound (should not count)
    addPassingYearPreBound(goldUnlockYear)
    addPassingYearPreBound(goldUnlockYear - 1)

    // Three distinct qualifying years, including current year
    addPassingYear(earliest)
    addPassingYear(currentYear - 2)
    addPassingYear(currentYear)

    const profile = {
      unlockedMedals: [
        { medalId: 'pistol-mark-gold', year: goldUnlockYear }
      ],
      prerequisites: ach
    }

    const calc = new MedalCalculator(db, profile)
    const res = calc.evaluateMedal('lower-annual-mark-star-1')

    expect(res.status).toBe('achievable')
    const sustained = res.details.items.find(i => i.type === 'sustained_achievement')
    expect(sustained).toBeTruthy()
    expect(sustained.isMet).toBe(true)
    expect(sustained.progress.required).toBe(3)
    // Ensure we did not accidentally count pre-bound years
    expect(sustained.progress.current).toBeGreaterThanOrEqual(3)
  })

  test('fails when current year does not qualify even if enough historical years exist', () => {
    const pistolGold = buildPistolGold()
    const lowerAnnual = buildLowerAnnualStar1()
    const medals = [pistolGold, lowerAnnual]
    const db = makeDb(medals)

    const goldUnlockYear = currentYear - 6
    const earliest = goldUnlockYear + 1

    // Build 3 qualifying years but none in current year
    const ach = []
    const addPassingYear = (y) => {
      ach.push(
        precisionSeries(y, 50), precisionSeries(y, 50), precisionSeries(y, 50),
        applicationSeries(y, 6, 30), applicationSeries(y, 6, 30), applicationSeries(y, 6, 30)
      )
    }
    addPassingYear(earliest)
    addPassingYear(currentYear - 3)
    addPassingYear(currentYear - 1) // still not current year

    const profile = {
      unlockedMedals: [{ medalId: 'pistol-mark-gold', year: goldUnlockYear }],
      prerequisites: ach
    }

    const calc = new MedalCalculator(db, profile)
    const res = calc.evaluateMedal('lower-annual-mark-star-1')

    expect(res.status).toBe('locked')
    expect(res.reason).toBe('requirements_not_met')
    const sustained = res.details.items.find(i => i.type === 'sustained_achievement')
    expect(sustained).toBeTruthy()
    expect(sustained.isMet).toBe(false)
  })

  test('3-of-6 sustained is measured in the window ending current year', () => {
    const pistolGold = buildPistolGold()
    const lowerAnnual = buildLowerAnnualStar1()
    const sustain3of6 = buildSustain3of6({ id: 'pistol-annual-3-of-6', prereqMedalId: 'lower-annual-mark-star-1' })
    const medals = [pistolGold, lowerAnnual, sustain3of6]
    const db = makeDb(medals)

    const goldUnlockYear = currentYear - 8
    const lowerAnnualUnlockYear = currentYear - 7

    const ach = []
    const addPassingYear = (y) => {
      ach.push(
        precisionSeries(y, 50), precisionSeries(y, 50), precisionSeries(y, 50),
        applicationSeries(y, 6, 30), applicationSeries(y, 6, 30), applicationSeries(y, 6, 30)
      )
    }
    // Qualifiers inside the last 6-year window [currentYear-5, currentYear]
    addPassingYear(currentYear - 5)
    addPassingYear(currentYear - 1)
    addPassingYear(currentYear)

    // Noise outside window (should not affect result)
    addPassingYear(currentYear - 6)
    addPassingYear(currentYear - 7)

    const profile = {
      unlockedMedals: [
        { medalId: 'pistol-mark-gold', year: goldUnlockYear },
        { medalId: 'lower-annual-mark-star-1', year: lowerAnnualUnlockYear }
      ],
      prerequisites: ach
    }

    const calc = new MedalCalculator(db, profile)
    const res = calc.evaluateMedal('pistol-annual-3-of-6')

    expect(res.status).toBe('achievable')
    const sustained = res.details.items.find(i => i.type === 'sustained_achievement')
    expect(sustained).toBeTruthy()
    expect(sustained.isMet).toBe(true)
    expect(sustained.progress.required).toBe(3)
    // Because windowed and require-current, windowYear should be current year
    expect(sustained.windowYear).toBe(currentYear)
    expect(res.details.unlockYear).toBe(currentYear)
  })

  test('cross-type sustained does NOT apply earliestCountingYear bound (achievements may be re-used)', () => {
    const pistolGold = buildPistolGold()
    const otherAnnual = buildOtherTypeAnnual()
    const medals = [pistolGold, otherAnnual]
    const db = makeDb(medals)

    const goldUnlockYear = currentYear - 2 // unlock recently

    const ach = []
    const addPassingYear = (y) => {
      ach.push(
        precisionSeries(y, 50), precisionSeries(y, 50), precisionSeries(y, 50),
        applicationSeries(y, 6, 30), applicationSeries(y, 6, 30), applicationSeries(y, 6, 30)
      )
    }
    // Include a qualifying year BEFORE the pistol gold unlock (cross-type should still count it)
    addPassingYear(goldUnlockYear - 3)
    // Another historical year
    addPassingYear(goldUnlockYear - 1)
    // And current year
    addPassingYear(currentYear)

    const profile = {
      unlockedMedals: [{ medalId: 'pistol-mark-gold', year: goldUnlockYear }],
      prerequisites: ach
    }

    const calc = new MedalCalculator(db, profile)
    const res = calc.evaluateMedal('other-annual')

    expect(res.status).toBe('achievable')
    const sustained = res.details.items.find(i => i.type === 'sustained_achievement')
    expect(sustained).toBeTruthy()
    expect(sustained.isMet).toBe(true)
    expect(sustained.progress.required).toBe(3)
  })

  test('multiple references require ALL referenced medals to qualify in the same year', () => {
    const pistolGold = buildPistolGold() // needs hits >= 6, time <= 40
    const auxGold = buildAuxGoldStrict() // needs hits >= 7, time <= 35 (stricter)
    const dualRef = buildDualReferenceAnnual()

    const medals = [pistolGold, auxGold, dualRef]
    const db = makeDb(medals)

    const goldUnlockYear = currentYear - 4
    const ach = []
    const addPistolGoldPassingYear = (y) => {
      ach.push(
        precisionSeries(y, 50), precisionSeries(y, 50), precisionSeries(y, 50),
        applicationSeries(y, 6, 30), applicationSeries(y, 6, 30), applicationSeries(y, 6, 30)
      )
    }
    // Current year: passes pistolGold but FAILS auxGold due to stricter hits/time
    addPistolGoldPassingYear(currentYear)

    const profile = {
      unlockedMedals: [{ medalId: 'pistol-mark-gold', year: goldUnlockYear }],
      prerequisites: ach
    }

    const calc = new MedalCalculator(db, profile)
    const res = calc.evaluateMedal('dual-ref-annual')

    expect(res.status).toBe('locked')
    expect(res.reason).toBe('requirements_not_met')
    const sustained = res.details.items.find(i => i.type === 'sustained_achievement')
    expect(sustained).toBeTruthy()
    expect(sustained.isMet).toBe(false)
  })
})
