/**
 * Evaluates medal status based on user achievements
 */
export class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase
    this.profile = userProfile || { unlockedMedals: [], prerequisites: [] }
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
          description: prereq.description,
          yearOffset: prereq.yearOffset
        }
        items.push(item)
        if (!isMet) {
          missingItems.push(item)
        } else if (typeof prereq.yearOffset === 'number') {
          // Optional: ensure at least yearOffset gap if provided
          const achievedYear = this.getUnlockedYear(prereq.medalId)
          const currentYear = this.getMostRecentAchievementYear() ?? new Date().getFullYear()
          const gapOk = achievedYear !== null ? (currentYear - achievedYear) >= prereq.yearOffset : false
          const offsetItem = { ...item, isMet: gapOk, offsetChecked: true }
          if (!gapOk) missingItems.push(offsetItem)
        }
      } else if (prereq.type === 'age_requirement') {
        // Age requirements would be checked against profile data if available
        // Placeholder: mark unmet if we don't have age info
        const isMet = false
        const item = {
          type: 'age_requirement',
          isMet,
          minAge: prereq.minAge,
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

  getUnlockedYear(medalId) {
    const unlocked = this.profile.unlockedMedals?.find(m => m.medalId === medalId)
    if (!unlocked) return null
    if (unlocked.year) return unlocked.year
    if (unlocked.unlockedDate) return new Date(unlocked.unlockedDate).getFullYear()
    return null
  }

  getMostRecentAchievementYear() {
    const achievements = this.profile.prerequisites || []
    if (!achievements.length) return null
    return achievements.reduce((max, a) => Math.max(max, a.year || max), 0)
  }

  checkRequirements(medal) {
    if (!medal.requirements || medal.requirements.length === 0) {
      return { allMet: true, items: [] }
    }

    const items = []

    medal.requirements.forEach((req, idx) => {
      if (req.type === 'precision_series') {
        items.push(this.checkPrecisionSeriesRequirement(req, idx))
      } else if (req.type === 'sustained_achievement') {
        items.push(this.checkSustainedAchievementRequirement(req, idx))
      } else if (req.type === 'championship_competition') {
        items.push(this.checkChampionshipRequirement(req, idx))
      } else if (req.type === 'application_series') {
        items.push(this.checkApplicationSeriesRequirement(req, idx))
      } else {
        items.push({
          type: req.type,
          index: idx,
          isMet: false,
          reason: 'unsupported_requirement_type',
          description: req.description
        })
      }
    })

    return {
      allMet: items.every(item => item.isMet),
      items
    }
  }

  checkPrecisionSeriesRequirement(req, index) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')

    // Optionally filter to a specific year if timeWindowYears === 1 by grouping by year
    let candidates = achievements
    if (req.timeWindowYears === 1) {
      const byYear = this.groupBy(achievements, a => a.year)
      // Pick the year with max qualifying results
      let bestYear = null
      let bestMatches = []
      Object.entries(byYear).forEach(([year, list]) => {
        const matches = this.filterByPrecisionSeriesThreshold(list, req)
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestYear = Number(year)
        }
      })
      candidates = bestMatches
    } else if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 1) {
      const currentYear = new Date().getFullYear()
      const windowStart = currentYear - req.timeWindowYears + 1
      const withinWindow = achievements.filter(a => (a.year ?? 0) >= windowStart && (a.year ?? 0) <= currentYear)
      candidates = this.filterByPrecisionSeriesThreshold(withinWindow, req)
    } else {
      candidates = this.filterByPrecisionSeriesThreshold(achievements, req)
    }

    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'precision_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      pointThresholds: {
        A: req.pointThresholds?.A?.min,
        B: req.pointThresholds?.B?.min,
        C: req.pointThresholds?.C?.min,
        R: req.pointThresholds?.R?.min
      }
    }
  }

  checkApplicationSeriesRequirement(req, index) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'application_series')

    let candidates = achievements
    if (req.timeWindowYears === 1) {
      const byYear = this.groupBy(achievements, a => a.year)
      let bestMatches = []
      Object.values(byYear).forEach(list => {
        const matches = list.filter(a => {
          const hasMin = Array.isArray(req.options) && req.options.some(opt => typeof opt.minHits === 'number')
          if (!hasMin) return true
          const min = Math.max(...req.options.map(opt => (typeof opt.minHits === 'number' ? opt.minHits : 0)))
          return typeof a.hits === 'number' && a.hits >= min
        })
        if (matches.length > bestMatches.length) {
          bestMatches = matches
        }
      })
      candidates = bestMatches
    } else if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 1) {
      const currentYear = new Date().getFullYear()
      const windowStart = currentYear - req.timeWindowYears + 1
      const withinWindow = achievements.filter(a => (a.year ?? 0) >= windowStart && (a.year ?? 0) <= currentYear)
      candidates = withinWindow.filter(a => {
        const hasMin = Array.isArray(req.options) && req.options.some(opt => typeof opt.minHits === 'number')
        if (!hasMin) return true
        const min = Math.max(...req.options.map(opt => (typeof opt.minHits === 'number' ? opt.minHits : 0)))
        return typeof a.hits === 'number' && a.hits >= min
      })
    } else {
      candidates = achievements.filter(a => {
        const hasMin = Array.isArray(req.options) && req.options.some(opt => typeof opt.minHits === 'number')
        if (!hasMin) return true
        const min = Math.max(...req.options.map(opt => (typeof opt.minHits === 'number' ? opt.minHits : 0)))
        return typeof a.hits === 'number' && a.hits >= min
      })
    }

    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'application_series',
      index,
      isMet: met,
      progress,
      description: req.description
    }
  }

  filterByPrecisionSeriesThreshold(list, req) {
    const thresholds = {
      A: req.pointThresholds?.A?.min ?? 0,
      B: req.pointThresholds?.B?.min ?? 0,
      C: req.pointThresholds?.C?.min ?? 0,
      R: req.pointThresholds?.R?.min ?? 0
    }
    return (list || []).filter(a => {
      const group = a.weaponGroup || 'A'
      const min = thresholds[group]
      return typeof a.points === 'number' && a.points >= min
    })
  }

  groupBy(list, keyFn) {
    return (list || []).reduce((acc, item) => {
      const key = keyFn(item)
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})
  }

  checkSustainedAchievementRequirement(req, index) {
    // Star progression: require N years of achievement at/above minPointsPerYear over timeWindowYears
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')
    const byYear = this.groupBy(achievements, a => a.year)
    const minYears = req.yearsOfAchievement ?? 3
    const minPoints = req.minPointsPerYear ?? 0

    const qualifyingYears = Object.entries(byYear).filter(([year, list]) => {
      return list.some(a => {
        const group = a.weaponGroup || 'A'
        // If requirements provide thresholds per group use them, else use minPointsPerYear
        const groupThreshold = req.pointThresholds?.[group]?.min ?? minPoints
        return typeof a.points === 'number' && a.points >= groupThreshold
      })
    })

    const progress = { current: qualifyingYears.length, required: minYears }
    const met = progress.current >= progress.required

    return {
      type: 'sustained_achievement',
      index,
      isMet: met,
      progress,
      description: req.description
    }
  }

  checkChampionshipRequirement(req, index) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'competition_result')

    let list = achievements
    if (req.competitionType) {
      list = list.filter(a => a.competitionType === req.competitionType)
    }
    if (req.medalTier) {
      list = list.filter(a => a.medalType === req.medalTier)
    }

    if (req.timeWindowYears) {
      const currentYear = new Date().getFullYear()
      const windowStart = currentYear - req.timeWindowYears + 1
      list = list.filter(a => (a.year ?? 0) >= windowStart && (a.year ?? 0) <= currentYear)
    }

    const required = req.minAchievements ?? 1
    const progress = { current: list.length, required }
    const met = progress.current >= required

    return {
      type: 'championship_competition',
      index,
      isMet: met,
      progress,
      description: req.description
    }
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
