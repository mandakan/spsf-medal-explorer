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
