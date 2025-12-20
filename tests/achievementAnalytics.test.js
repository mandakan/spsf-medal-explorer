import { calculateAchievementStats } from '../src/logic/achievementAnalytics'

describe('achievementAnalytics', () => {
  test('returns zeros for empty list', () => {
    expect(calculateAchievementStats([])).toEqual({
      totalAchievements: 0,
      avgPointsPerYear: 0,
      bestYear: null,
      yearsActive: 0,
      pointsByYear: {}
    })
  })

  test('calculates basic stats', () => {
    const achievements = [
      { year: 2024, points: 10 },
      { year: 2024, points: 5 },
      { year: 2025, points: 20 }
    ]
    const stats = calculateAchievementStats(achievements)
    expect(stats.totalAchievements).toBe(3)
    expect(stats.yearsActive).toBe(2)
    expect(stats.bestYear).toBe(2025)
    expect(stats.bestYearPoints).toBe(20)
    // avgPointsPerYear = (10+5+20)/2 = 17.5
    expect(stats.avgPointsPerYear).toBeCloseTo(17.5, 5)
    expect(stats.pointsByYear).toEqual({ 2024: 15, 2025: 20 })
  })
})
