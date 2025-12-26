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
  evaluateMedal(medalId, opts = {}) {
    const medal = this.medals.getMedalById(medalId)
    if (!medal) {
      throw new Error(`Medal not found: ${medalId}`)
    }

    // Placeholders are non-actionable
    if ((typeof medal.isPlaceholder === 'function' && medal.isPlaceholder()) || medal.status === 'placeholder') {
      return {
        medalId,
        status: 'locked',
        reason: 'placeholder',
        details: { message: 'Placeholder medal' }
      }
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
        .filter(p => {
          // Consider time-awareness: prerequisite must be unlocked on or before the evaluation endYear (if provided)
          if (!this.hasUnlockedMedal(p.medalId)) return true
          if (typeof opts.endYear === 'number') {
            const y = this.getUnlockedYear(p.medalId)
            return !(typeof y === 'number' && y <= opts.endYear)
          }
          return false
        })
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
    const reqsCheck = this.checkRequirements(medal, opts)
    if (!reqsCheck.allMet) {
      return {
        medalId,
        status: 'locked',
        reason: 'requirements_not_met',
        details: reqsCheck
      }
    }

    // Check prerequisites using the planned unlock year (calendar-year semantics)
    const prereqsCheck = this.checkPrerequisites(medal, (reqsCheck.unlockYear ?? opts.endYear))
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
        const unlockedYear = this.getUnlockedYear(prereq.medalId)
        const isUnlocked = this.hasUnlockedMedal(prereq.medalId)
        const isMet = isUnlocked && (typeof targetYear === 'number' ? (typeof unlockedYear === 'number' && unlockedYear <= targetYear) : true)
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
        const dobStr = this.profile?.dateOfBirth
        let age = null
        let isMet = false

        if (dobStr) {
          const dob = new Date(dobStr)
          if (!Number.isNaN(dob.getTime())) {
            const refDate = typeof targetYear === 'number' ? new Date(targetYear, 11, 31) : new Date()
            let a = refDate.getFullYear() - dob.getFullYear()
            const monthDiff = refDate.getMonth() - dob.getMonth()
            const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dob.getDate())
            if (beforeBirthday) a -= 1
            age = a

            const minOk = typeof prereq.minAge === 'number' ? age >= prereq.minAge : true
            const maxOk = typeof prereq.maxAge === 'number' ? age <= prereq.maxAge : true
            isMet = minOk && maxOk
          }
        }

        const item = {
          type: 'age_requirement',
          isMet,
          minAge: prereq.minAge,
          ...(prereq.maxAge != null ? { maxAge: prereq.maxAge } : {}),
          ...(age != null ? { age } : {}),
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

  /**
   * For sustained achievements: compute the minimal calendar year allowed
   * based on the sustained requirement's yearsOfAchievement (N) and the most
   * recent unlock year among same-type prerequisite medals.
   * Example: last same-type prereq = 2021, yearsOfAchievement=3 => earliest = 2024
   */
  getMinimalUnlockYearForSustained(parentMedal) {
    if (!parentMedal) return null
    const req = (parentMedal.requirements || []).find(r => r?.type === 'sustained_achievement')
    if (!req) return null
    const minYears = Number.isFinite(req?.yearsOfAchievement) ? req.yearsOfAchievement : 1
    const sameTypeIds = this.getSameTypePrereqMedalIds(parentMedal)
    const years = sameTypeIds.map(id => this.getUnlockedYear(id)).filter(y => typeof y === 'number')
    if (!years.length) return null
    const lastYear = Math.max(...years)
    return lastYear + minYears
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
    const spec = medal.requirements
    // No requirements => trivially met
    if (!spec || (Array.isArray(spec) && spec.length === 0)) {
      return { allMet: true, items: [], unlockYear: null, tree: { node: 'and', isMet: true, children: [] } }
    }

    const root = this.normalizeRequirementSpec(spec)
    const evalAt = (endYear) => this.evaluateReqNode(root, medal, { ...opts, endYear })

    // If caller provides a concrete endYear, evaluate the whole expression for that year
    if (typeof opts.endYear === 'number') {
      const tree = evalAt(opts.endYear)
      const allMet = !!tree.isMet
      return {
        allMet,
        items: this.flattenLeaves(tree),
        unlockYear: allMet ? opts.endYear : null,
        tree
      }
    }

    // Otherwise, scan candidate years (newest first) and pick the first that satisfies the expression
    const candidates = this.getCandidateYearsForTree()
    for (const y of candidates) {
      const tree = evalAt(y)
      if (tree.isMet) {
        return {
          allMet: true,
          items: this.flattenLeaves(tree),
          unlockYear: y,
          tree
        }
      }
    }

    // Not achievable in any candidate year; return evaluated tree without endYear for progress/debug
    const tree = this.evaluateReqNode(root, medal, opts)
    return {
      allMet: false,
      items: this.flattenLeaves(tree),
      unlockYear: null,
      tree
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

  // Normalize requirement spec into a boolean expression tree (AST)
  // - Arrays become implicit AND
  // - { and: [...] } and { or: [...] } become operator nodes
  // - Any other object is treated as a leaf requirement with a type
  normalizeRequirementSpec(spec) {
    if (Array.isArray(spec)) {
      return { op: 'and', children: spec.map(s => this.normalizeRequirementSpec(s)) }
    }
    if (spec && typeof spec === 'object') {
      if (Array.isArray(spec.and)) {
        return { op: 'and', children: spec.and.map(s => this.normalizeRequirementSpec(s)) }
      }
      if (Array.isArray(spec.or)) {
        return { op: 'or', children: spec.or.map(s => this.normalizeRequirementSpec(s)) }
      }
      return { op: 'leaf', req: spec }
    }
    return { op: 'leaf', req: {} }
  }

  // Evaluate a requirement node for a specific endYear (calendar semantics)
  evaluateReqNode(node, medal, opts = {}) {
    if (!node) return { node: 'leaf', isMet: false, leaf: { type: 'unknown', index: -1, isMet: false } }

    if (node.op === 'and') {
      const children = node.children?.map(ch => this.evaluateReqNode(ch, medal, opts)) || []
      const isMet = children.every(r => r.isMet)
      return { node: 'and', isMet, children }
    }

    if (node.op === 'or') {
      const children = node.children?.map(ch => this.evaluateReqNode(ch, medal, opts)) || []
      const isMet = children.some(r => r.isMet)
      return { node: 'or', isMet, children }
    }

    // Leaf requirement
    const req = node.req || {}
    let leaf
    switch (req.type) {
      case 'precision_series':
        leaf = this.checkPrecisionSeriesRequirement(req, -1, opts)
        break
      case 'application_series':
        leaf = this.checkApplicationSeriesRequirement(req, -1, opts)
        break
      case 'sustained_achievement':
        leaf = this.checkSustainedAchievementRequirement(req, -1, medal, opts)
        break
      case 'championship_competition':
        leaf = this.checkChampionshipRequirement(req, -1, opts)
        break
      case 'standard_medal':
        leaf = this.checkStandardMedalRequirement(req, -1, opts)
        break
      default:
        leaf = {
          type: req.type,
          index: -1,
          isMet: false,
          reason: 'unsupported_requirement_type',
          description: req.description
        }
        break
    }
    return { node: 'leaf', isMet: !!leaf.isMet, leaf }
  }

  // Collect all leaf results from an evaluated tree (for UI/progress)
  flattenLeaves(resultNode, out = []) {
    if (!resultNode) return out
    if (resultNode.node === 'leaf') {
      out.push(resultNode.leaf)
      return out
    }
    for (const ch of resultNode.children || []) {
      this.flattenLeaves(ch, out)
    }
    return out
  }

  // Candidate end years to try when no specific endYear is provided
  getCandidateYearsForTree() {
    const years = new Set(this.getAllAchievementYears())
    const current = new Date().getFullYear()
    years.add(current)
    return Array.from(years).sort((a, b) => b - a)
  }

  checkSustainedAchievementRequirement(req, index, parentMedal, opts = {}) {
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
    const featureEnforce = this.profile?.features?.enforceCurrentYearForSustained === true
    // If feature is ON, always use the real current year (ignore opts.endYear)
    const currentYear = featureEnforce
      ? new Date().getFullYear()
      : ((opts && typeof opts.endYear === 'number') ? opts.endYear : new Date().getFullYear())

    // By default, when using references, the current year must be included
    let requireCurrent =
      req.mustIncludeCurrentYear === true ||
      parentMedal?.mustIncludeCurrentYear === true ||
      effectiveReferences.length > 0
    // Feature override: force requiring the real current year
    if (featureEnforce) requireCurrent = true

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

  checkStandardMedalRequirement(req, index, opts = {}) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'standard_medal')

    let list = achievements
    if (req.discplineType) {
      list = list.filter(a => a.disciplineType === req.disciplineType)
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
      type: 'standard_medal',
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

  getEligibleYears(medalId) {
    // If already unlocked at any time, do not offer additional unlock years
    if (this.hasUnlockedMedal(medalId)) return []
    const candidates = this.getAllAchievementYears().sort((a, b) => b - a)
    const eligible = []
    for (const y of candidates) {
      try {
        const res = this.evaluateMedal(medalId, { endYear: y })
        if (res && res.status === 'achievable') {
          eligible.push(y)
        }
      } catch {
        // ignore evaluation errors for candidate years
      }
    }
    return eligible
  }
}
