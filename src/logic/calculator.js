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

    // Basic prerequisite presence check (ignore yearOffset to ensure precedence)
    if (Array.isArray(medal.prerequisites)) {
      const missing = medal.prerequisites
        .filter(p => p?.type === 'medal')
        .filter(p => !this.hasUnlockedMedal(p.medalId))
      if (missing.length) {
        return {
          medalId,
          status: 'locked',
          reason: 'prerequisites_not_met',
          details: { prerequisites: { missingMedals: missing.map(p => p.medalId) } }
        }
      }
    }

    // Check requirements first to determine calendar unlock year
    const reqsCheck = this.checkRequirements(medal)
    if (!reqsCheck.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'requirements_not_met',
        details: reqsCheck
      }
    }

    // Check prerequisites using the planned unlock year (calendar-year semantics)
    const prereqsCheck = this.checkPrerequisites(medal, reqsCheck.unlockYear)
    if (!prereqsCheck.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'prerequisites_not_met',
        details: prereqsCheck
      }
    }

    return {
      medalId,
      status: 'achievable',
      achievableYear: reqsCheck.unlockYear ?? null,
      details: { ...reqsCheck, prerequisites: prereqsCheck }
    }
  }

  hasUnlockedMedal(medalId) {
    return this.profile.unlockedMedals?.some(m => m.medalId === medalId) || false
  }

  getUnlockedDate(medalId) {
    const unlocked = this.profile.unlockedMedals?.find(m => m.medalId === medalId)
    return unlocked ? unlocked.unlockedDate : null
  }

  checkPrerequisites(medal, targetYear) {
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
          // Ensure at least yearOffset gap in calendar years if provided
          const achievedYear = this.getUnlockedYear(prereq.medalId)
          const plannedYear = typeof targetYear === 'number'
            ? targetYear
            : (this.getMostRecentAchievementYear() ?? new Date().getFullYear())
          const gapOk = achievedYear !== null ? (plannedYear - achievedYear) >= prereq.yearOffset : false
          const offsetItem = { ...item, isMet: gapOk, offsetChecked: true, plannedYear }
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

  getSameTypePrereqMedalIds(parentMedal) {
    const type = parentMedal?.type
    if (!type) return []
    return (parentMedal?.prerequisites || [])
      .filter(p => p?.type === 'medal')
      .map(p => p.medalId)
      .filter(id => {
        const m = this.medals.getMedalById(id)
        return m && m.type === type
      })
  }

  getEarliestCountingYearForMedal(parentMedal) {
    const ids = this.getSameTypePrereqMedalIds(parentMedal)
    const years = ids.map(id => this.getUnlockedYear(id)).filter(y => typeof y === 'number')
    if (!years.length) return null
    return Math.max(...years) + 1
  }

  getAllAchievementYears() {
    const a = this.profile.prerequisites || []
    const years = new Set()
    for (const r of a) {
      const y = Number(r.year)
      if (!Number.isNaN(y)) years.add(y)
    }
    return Array.from(years).sort((x, y) => x - y)
  }

  requirementsMetInYear(medalIdOrMedal, year) {
    const m = typeof medalIdOrMedal === 'string'
      ? this.medals.getMedalById(medalIdOrMedal)
      : medalIdOrMedal
    if (!m) return false
    const res = this.checkRequirements(m, { endYear: year })
    return res.allMet
  }

  checkRequirements(medal, opts = {}) {
    if (!medal.requirements || medal.requirements.length === 0) {
      return { allMet: true, items: [], unlockYear: null }
    }

    const items = []

    medal.requirements.forEach((req, idx) => {
      if (req.type === 'precision_series') {
        items.push(this.checkPrecisionSeriesRequirement(req, idx, opts))
      } else if (req.type === 'sustained_achievement') {
        items.push(this.checkSustainedAchievementRequirement(req, idx, medal))
      } else if (req.type === 'championship_competition') {
        items.push(this.checkChampionshipRequirement(req, idx, opts))
      } else if (req.type === 'application_series') {
        items.push(this.checkApplicationSeriesRequirement(req, idx, opts))
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

    const years = items.filter(i => i.isMet && i.windowYear != null).map(i => i.windowYear)
    const uniqueYears = Array.from(new Set(years))
    const yearConflict = uniqueYears.length > 1
    const unlockYear = uniqueYears.length === 1 ? uniqueYears[0] : null

    return {
      allMet: items.every(item => item.isMet) && !yearConflict,
      items,
      unlockYear,
      ...(yearConflict ? { yearConflict: { years: uniqueYears } } : {})
    }
  }

  checkPrecisionSeriesRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')

    // If evaluating with a fixed end year (for referenced checks), constrain the data to that year/window
    if (opts.endYear != null) {
      let achievements = all
      const tw = req.timeWindowYears
      if (tw === 1) {
        achievements = all.filter(a => a.year === opts.endYear)
      } else if (typeof tw === 'number' && tw > 1) {
        const start = opts.endYear - tw + 1
        achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
      } else {
        achievements = all.filter(a => a.year === opts.endYear)
      }

      const candidates = this.filterByPrecisionSeriesThreshold(achievements, req)
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
        },
        windowYear: met ? opts.endYear : null
      }
    }

    // Default path: pick the best calendar year or block
    const applyThresholds = (list) => this.filterByPrecisionSeriesThreshold(list, req)

    let candidates = []
    let windowYear = null

    if (req.timeWindowYears === 1) {
      const byYear = this.groupBy(all, a => a.year)
      // Pick the calendar year with max qualifying results
      let bestYear = null
      let bestMatches = []
      Object.entries(byYear).forEach(([year, list]) => {
        const matches = applyThresholds(list)
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestYear = Number(year)
        }
      })
      candidates = bestMatches
      windowYear = bestYear
    } else if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 1) {
      // Use calendar-year blocks; evaluate all possible end years in the data
      const years = Array.from(new Set(all.map(a => a.year).filter(y => typeof y === 'number'))).sort((a, b) => a - b)
      let bestEndYear = null
      let bestMatches = []
      for (const endYear of years) {
        const startYear = endYear - req.timeWindowYears + 1
        const inBlock = all.filter(a => (a.year ?? 0) >= startYear && (a.year ?? 0) <= endYear)
        const matches = applyThresholds(inBlock)
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestEndYear = endYear
        }
      }
      candidates = bestMatches
      windowYear = bestEndYear
    } else {
      candidates = applyThresholds(all)
      // no specific window; do not assign windowYear
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
      },
      windowYear: met ? windowYear : null
    }
  }

  checkApplicationSeriesRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'application_series')

    const passes = (a) => {
      const g = a.weaponGroup || 'A'
      const th = req.thresholds?.[g]
      if (!th) return false
      const hasTime = typeof a.timeSeconds === 'number' && a.timeSeconds > 0
      const hasHits = typeof a.hits === 'number' && a.hits >= 0
      const timeOk = typeof th.maxTimeSeconds === 'number' ? a.timeSeconds <= th.maxTimeSeconds : true
      const hitsOk = typeof th.minHits === 'number' ? a.hits >= th.minHits : true
      return hasTime && hasHits && timeOk && hitsOk
    }

    // If evaluating with a fixed end year (for referenced checks), constrain the data to that year/window
    if (opts.endYear != null) {
      let achievements = all
      const tw = req.timeWindowYears
      if (tw === 1) {
        achievements = all.filter(a => a.year === opts.endYear)
      } else if (typeof tw === 'number' && tw > 1) {
        const start = opts.endYear - tw + 1
        achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
      } else {
        achievements = all.filter(a => a.year === opts.endYear)
      }

      const candidates = achievements.filter(passes)
      const required = req.minAchievements ?? 1
      const progress = { current: candidates.length, required }
      const met = progress.current >= required

      return {
        type: 'application_series',
        index,
        isMet: met,
        progress,
        description: req.description,
        windowYear: met ? opts.endYear : null
      }
    }

    // Default path: pick the best calendar year or block
    let candidates = []
    let windowYear = null

    if (req.timeWindowYears === 1) {
      const byYear = this.groupBy(all, a => a.year)
      let bestMatches = []
      let bestYear = null
      Object.entries(byYear).forEach(([year, list]) => {
        const matches = list.filter(passes)
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestYear = Number(year)
        }
      })
      candidates = bestMatches
      windowYear = bestYear
    } else if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 1) {
      // Calendar-year blocks across the data; choose the best end year
      const years = Array.from(new Set(all.map(a => a.year).filter(y => typeof y === 'number'))).sort((a, b) => a - b)
      let bestEndYear = null
      let bestMatches = []
      for (const endYear of years) {
        const startYear = endYear - req.timeWindowYears + 1
        const inBlock = all.filter(a => (a.year ?? 0) >= startYear && (a.year ?? 0) <= endYear)
        const matches = inBlock.filter(passes)
        if (matches.length > bestMatches.length) {
          bestMatches = matches
          bestEndYear = endYear
        }
      }
      candidates = bestMatches
      windowYear = bestEndYear
    } else {
      candidates = all.filter(passes)
      // no specific window; do not assign windowYear
    }

    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'application_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? windowYear : null
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

  checkSustainedAchievementRequirement(req, index, parentMedal) {
    const minYears = req.yearsOfAchievement ?? 3

    // References: prefer explicit (on req or medal); else infer from same-type prerequisite chain
    const explicitRefs = (req.references || parentMedal?.references || [])
      .map(r => (typeof r === 'string' ? { medalId: r } : r))
      .filter(r => r && r.medalId)
    const sameTypePrereqs = this.getSameTypePrereqMedalIds(parentMedal)
    const inferredRefs = explicitRefs.length ? [] : sameTypePrereqs.map(id => ({ medalId: id }))
    const effectiveReferences = explicitRefs.length ? explicitRefs : inferredRefs

    // Earliest counting year must be after previous same-type medal unlock
    const earliestCountingYear = this.getEarliestCountingYearForMedal(parentMedal)
    const currentYear = new Date().getFullYear()

    // By default, when using references, the current year must be included
    const requireCurrent =
      req.mustIncludeCurrentYear === true ||
      parentMedal?.mustIncludeCurrentYear === true ||
      effectiveReferences.length > 0

    // Candidate years
    let allYears
    if (effectiveReferences.length > 0) {
      allYears = this.getAllAchievementYears()
    } else {
      const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')
      const byYear = this.groupBy(achievements, a => a.year)
      allYears = Object.keys(byYear).map(y => Number(y)).filter(y => !Number.isNaN(y)).sort((a, b) => a - b)
    }

    if (typeof earliestCountingYear === 'number') {
      allYears = allYears.filter(y => y >= earliestCountingYear)
    }
    if (requireCurrent) {
      allYears = allYears.filter(y => y <= currentYear)
    }

    // Build qualifying year set
    let qualifyingYearsSet
    if (effectiveReferences.length > 0) {
      const qualifies = (y) => effectiveReferences.every(ref => this.requirementsMetInYear(ref.medalId, y))
      qualifyingYearsSet = new Set(allYears.filter(qualifies))
    } else {
      // Threshold mode (legacy path)
      const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')
      const byYear = this.groupBy(achievements, a => a.year)
      const minPoints = req.minPointsPerYear ?? 0
      const yearQualifies = (list) => {
        return (list || []).some(a => {
          const group = a.weaponGroup || 'A'
          const groupThreshold = req.pointThresholds?.[group]?.min ?? minPoints
          return typeof a.points === 'number' && a.points >= groupThreshold
        })
      }
      qualifyingYearsSet = new Set(allYears.filter(y => yearQualifies(byYear[y])))
    }

    let progress, met, windowYear = null

    if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 0) {
      // Optionally constrain to current year as the window end
      let endYears = allYears
      if (requireCurrent && allYears.includes(currentYear)) {
        endYears = [currentYear]
      }

      let bestEndYear = null
      let bestCount = 0
      for (const endYear of endYears) {
        const startYear = endYear - req.timeWindowYears + 1
        let count = 0
        for (let y = startYear; y <= endYear; y++) {
          if (qualifyingYearsSet.has(y)) count++
        }
        if (count > bestCount) {
          bestCount = count
          bestEndYear = endYear
        }
      }
      progress = { current: bestCount, required: minYears }
      met = bestCount >= minYears
      windowYear = met ? bestEndYear : null
    } else {
      const total = qualifyingYearsSet.size
      progress = { current: total, required: minYears }
      met = total >= minYears
      if (met && requireCurrent && !qualifyingYearsSet.has(currentYear)) {
        met = false
      }
    }

    return {
      type: 'sustained_achievement',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear
    }
  }

  checkChampionshipRequirement(req, index, opts = {}) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'competition_result')

    let list = achievements
    if (req.competitionType) {
      list = list.filter(a => a.competitionType === req.competitionType)
    }
    if (req.medalTier) {
      list = list.filter(a => a.medalType === req.medalTier)
    }

    const endYear = (opts && typeof opts.endYear === 'number') ? opts.endYear : null
    if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 0) {
      const finalYear = endYear != null ? endYear : new Date().getFullYear()
      const windowStart = finalYear - req.timeWindowYears + 1
      list = list.filter(a => (a.year ?? 0) >= windowStart && (a.year ?? 0) <= finalYear)
    } else if (endYear != null) {
      list = list.filter(a => a.year === endYear)
    }

    const required = req.minAchievements ?? 1
    const progress = { current: list.length, required }
    const met = progress.current >= required

    return {
      type: 'championship_competition',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met && endYear != null ? endYear : null
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
