import { MedalCalculator } from '../src/logic/calculator'
import { MedalDatabase } from '../src/models/Medal'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'

describe('MedalCalculator', () => {
  let calculator, medalDb, profile

  beforeEach(() => {
    const medalData = {
      medals: [
        {
          id: 'pistol-mark-bronze',
          status: 'reviewed',
          type: 'pistol_mark',
          tier: 'bronze',
          displayName: 'Pistol Mark - Bronze',
          prerequisites: [],
          requirements: [{
            type: 'precision_series',
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
          status: 'reviewed',
          type: 'pistol_mark',
          tier: 'silver',
          displayName: 'Pistol Mark - Silver',
          prerequisites: [{ type: 'medal', medalId: 'pistol-mark-bronze' }],
          requirements: [{
            type: 'precision_series',
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
      dateOfBirth: '2000-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: []
    })

    calculator = new MedalCalculator(medalDb, profile)
  })

  test('marks bronze as achievable with 3 precision series in same year', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'precision_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 35
      }),
      new Achievement({
        type: 'precision_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 36
      }),
      new Achievement({
        type: 'precision_series',
        year: currentYear,
        weaponGroup: 'A',
        points: 37
      })
    ]

    const result = calculator.evaluateMedal('pistol-mark-bronze')
    expect(result.status).toBe('eligible')
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

describe('MedalCalculator - competition_performance', () => {
  let calculator, medalDb, profile

  beforeEach(() => {
    const medalData = {
      medals: [
        {
          id: 'run-mark-bronze',
          status: 'reviewed',
          type: 'running_mark',
          tier: 'bronze',
          displayName: 'Springskyttemärket Brons',
          prerequisites: [],
          requirements: [{
            type: 'competition_performance',
            disciplineType: 'running',
            minCompetitions: 1,
            timeWindowYears: 1,
            maxPoints: {
              male: 40,
              female: 46
            }
          }]
        },
        {
          id: 'field-mark-bronze',
          status: 'reviewed',
          type: 'field_mark',
          tier: 'bronze',
          displayName: 'Fältskyttemärket Brons',
          prerequisites: [],
          requirements: [{
            type: 'competition_performance',
            disciplineType: 'field',
            minCompetitions: 3,
            timeWindowYears: 1,
            pointThresholdPercent: {
              A: { min: 52 },
              B: { min: 60 },
              C: { min: 60 },
              R: { min: 56 }
            }
          }]
        }
      ]
    }

    medalDb = new MedalDatabase(medalData)
    profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: []
    })

    calculator = new MedalCalculator(medalDb, profile)
  })

  test('marks running bronze as eligible with valid points (maxPoints, lower is better)', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'running',
        points: 35 // less than maxPoints.male (40)
      })
    ]

    const result = calculator.evaluateMedal('run-mark-bronze')
    expect(result.status).toBe('eligible')
  })

  test('marks running bronze as available when points too high', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'running',
        points: 45 // more than maxPoints.male (40) - too high
      })
    ]

    const result = calculator.evaluateMedal('run-mark-bronze')
    expect(result.status).toBe('available')
  })

  test('respects sex-based maxPoints threshold for running', () => {
    const currentYear = new Date().getFullYear()
    profile.sex = 'female'
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'running',
        points: 44 // less than maxPoints.female (46) but more than male (40)
      })
    ]

    const result = calculator.evaluateMedal('run-mark-bronze')
    expect(result.status).toBe('eligible')
  })

  test('marks field bronze as eligible with 3 valid competitions (pointThresholdPercent)', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field',
        score: 25,
        maxScore: 48,
        scorePercent: (25 / 48) * 100 // ~52% >= 52% threshold for weapon group A
      }),
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field',
        score: 26,
        maxScore: 48,
        scorePercent: (26 / 48) * 100 // ~54%
      }),
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field',
        score: 27,
        maxScore: 48,
        scorePercent: (27 / 48) * 100 // ~56%
      })
    ]

    const result = calculator.evaluateMedal('field-mark-bronze')
    expect(result.status).toBe('eligible')
  })

  test('requires 3 competitions for field bronze', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field',
        scorePercent: 60 // above threshold
      }),
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field',
        scorePercent: 65
      })
      // Only 2 competitions - need 3
    ]

    const result = calculator.evaluateMedal('field-mark-bronze')
    expect(result.status).toBe('available')
  })

  test('filters achievements by disciplineType', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({
        type: 'competition_performance',
        year: currentYear,
        weaponGroup: 'A',
        disciplineType: 'field', // wrong discipline
        points: 35
      })
    ]

    const result = calculator.evaluateMedal('run-mark-bronze')
    expect(result.status).toBe('available')
  })
})

describe('MedalCalculator - air_pistol_precision', () => {
  let calculator, medalDb, profile

  beforeEach(() => {
    const medalData = {
      medals: [
        {
          id: 'air-pistol-mark-bronze',
          status: 'reviewed',
          type: 'air_pistol_mark',
          tier: 'bronze',
          displayName: 'Luftpistolmärket Brons',
          prerequisites: [],
          requirements: [{
            type: 'air_pistol_precision',
            minSeries: 5,
            timeWindowYears: 1,
            minPointsPerSeries: 66
          }]
        },
        {
          id: 'air-pistol-mark-silver',
          status: 'reviewed',
          type: 'air_pistol_mark',
          tier: 'silver',
          displayName: 'Luftpistolmärket Silver',
          prerequisites: [],
          requirements: [{
            type: 'air_pistol_precision',
            minSeries: 5,
            timeWindowYears: 1,
            minPointsPerSeries: 76
          }]
        },
        {
          id: 'air-pistol-mark-gold',
          status: 'reviewed',
          type: 'air_pistol_mark',
          tier: 'gold',
          displayName: 'Luftpistolmärket Guld',
          prerequisites: [],
          requirements: [{
            type: 'air_pistol_precision',
            minSeries: 5,
            timeWindowYears: 1,
            minPointsPerSeries: 88
          }]
        }
      ]
    }

    medalDb = new MedalDatabase(medalData)
    profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: []
    })

    calculator = new MedalCalculator(medalDb, profile)
  })

  test('marks bronze as eligible with 5 series >= 66 points', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 70 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 68 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 66 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 72 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 75 })
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-bronze')
    expect(result.status).toBe('eligible')
  })

  test('marks bronze as available with less than 5 series', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 70 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 68 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 66 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 72 })
      // Only 4 series - need 5
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-bronze')
    expect(result.status).toBe('available')
  })

  test('filters series by points threshold', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 70 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 68 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 66 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 72 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 65 }), // below threshold
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 64 })  // below threshold
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-bronze')
    expect(result.status).toBe('available') // Only 4 valid series (65 and 64 are below 66)
  })

  test('marks silver as eligible with 5 series >= 76 points', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 80 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 78 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 76 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 82 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 85 })
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-silver')
    expect(result.status).toBe('eligible')
  })

  test('marks gold as eligible with 5 series >= 88 points', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 90 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 88 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 92 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 89 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 95 })
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-gold')
    expect(result.status).toBe('eligible')
  })

  test('respects timeWindowYears constraint', () => {
    const currentYear = new Date().getFullYear()
    profile.prerequisites = [
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 70 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 68 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear, points: 66 }),
      new Achievement({ type: 'air_pistol_precision', year: currentYear - 1, points: 72 }), // previous year
      new Achievement({ type: 'air_pistol_precision', year: currentYear - 1, points: 75 })  // previous year
    ]

    const result = calculator.evaluateMedal('air-pistol-mark-bronze')
    expect(result.status).toBe('available') // Only 3 series in current year, need 5
  })
})
