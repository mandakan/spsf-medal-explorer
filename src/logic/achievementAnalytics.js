export function calculateAchievementStats(achievements) {
  if (!achievements || achievements.length === 0) {
    return {
      totalAchievements: 0,
      avgPointsPerYear: 0,
      bestYear: null,
      yearsActive: 0,
      pointsByYear: {}
    }
  }

  const pointsByYear = {}
  achievements.forEach(ach => {
    const year = ach.year
    if (year == null) return
    if (!pointsByYear[year]) {
      pointsByYear[year] = 0
    }
    pointsByYear[year] += Number(ach.points || 0)
  })

  const years = Object.keys(pointsByYear).map(Number).sort((a, b) => a - b)
  const bestYear = years.length > 0 ? years.reduce((best, y) => {
    return pointsByYear[y] > (pointsByYear[best] ?? -Infinity) ? y : best
  }, years[0]) : null
  const maxPoints = bestYear ? pointsByYear[bestYear] : 0

  const totalPoints = achievements.reduce((sum, a) => sum + Number(a.points || 0), 0)
  const denominator = Math.max(1, years.length)

  return {
    totalAchievements: achievements.length,
    avgPointsPerYear: totalPoints / denominator,
    bestYear,
    bestYearPoints: maxPoints,
    yearsActive: years.length,
    pointsByYear
  }
}
