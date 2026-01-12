/**
 * Evaluates medal status based on user achievements
 */
const CUSTOM_CRITERIA = new Map()
export class MedalCalculator {
  constructor(medalDatabase, userProfile) {
    this.medals = medalDatabase
    this.profile = userProfile || { unlockedMedals: [], prerequisites: [] }
  }

  static registerCustomCriterion(name, fn) {
    if (typeof name !== 'string' || !name) throw new Error('custom_criterion name must be a non-empty string')
    if (typeof fn !== 'function') throw new Error('custom_criterion handler must be a function')
    CUSTOM_CRITERIA.set(name, fn)
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
        status: 'available',
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
      status: 'eligible',
      eligibleYear: reqsCheck.unlockYear ?? null,
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

  requirementsMetInYear(medalIdOrMedal, year, extraOpts = {}) {
    const m = typeof medalIdOrMedal === 'string'
      ? this.medals.getMedalById(medalIdOrMedal)
      : medalIdOrMedal
    if (!m) return false
    const res = this.checkRequirements(m, { ...extraOpts, endYear: year })
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

  /**
   * Check precision series requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkPrecisionSeriesRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'precision_series')

    // Require endYear for year-aware evaluation
    if (opts.endYear == null) {
      return {
        type: 'precision_series',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    // Evaluate with a fixed end year, constrain the data to that year/window
    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === opts.endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = opts.endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
    } else {
      achievements = all.filter(a => a.year === opts.endYear)
    }

    // Resolve age-based thresholds if ageCategories are defined
    const age = this.getAgeAtYear(opts.endYear)
    const { thresholds: resolvedThresholds, matchedCategory } = this.resolveAgeBasedPrecisionThresholdsWithCategory(req, age)

    const candidates = this.filterByPrecisionSeriesThreshold(achievements, { pointThresholds: resolvedThresholds })
    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    // Include ageCategories for UI display if they exist
    const hasAgeCategories = Array.isArray(req.ageCategories) && req.ageCategories.length > 0

    return {
      type: 'precision_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      pointThresholds: {
        A: resolvedThresholds?.A?.min,
        B: resolvedThresholds?.B?.min,
        C: resolvedThresholds?.C?.min,
        R: resolvedThresholds?.R?.min
      },
      windowYear: met ? opts.endYear : null,
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean),
      ...(age != null ? { age } : {}),
      ...(hasAgeCategories ? { ageCategories: req.ageCategories, matchedAgeCategory: matchedCategory?.name || null } : {})
    }
  }

  /**
   * Resolve point thresholds based on age categories for precision series
   * @param {Object} req - Requirement specification with optional ageCategories
   * @param {number|null} age - Age at end of year, or null if unknown
   * @returns {Object} Resolved pointThresholds object
   */
  resolveAgeBasedPrecisionThresholds(req, age) {
    return this.resolveAgeBasedPrecisionThresholdsWithCategory(req, age).thresholds
  }

  /**
   * Resolve point thresholds based on age categories, returning both thresholds and matched category
   * @param {Object} req - Requirement specification with optional ageCategories
   * @param {number|null} age - Age at end of year, or null if unknown
   * @returns {{thresholds: Object, matchedCategory: Object|null}} Resolved thresholds and category
   */
  resolveAgeBasedPrecisionThresholdsWithCategory(req, age) {
    // If no ageCategories or age is unknown, use base thresholds
    if (!Array.isArray(req.ageCategories) || req.ageCategories.length === 0 || age == null) {
      return { thresholds: req.pointThresholds || {}, matchedCategory: null }
    }

    // Find matching age category
    const category = req.ageCategories.find(c => {
      const min = typeof c.ageMin === 'number' ? c.ageMin : 0
      const max = typeof c.ageMax === 'number' ? c.ageMax : 999
      return age >= min && age <= max
    })

    // Return category thresholds if found, otherwise base thresholds
    return {
      thresholds: category?.pointThresholds || req.pointThresholds || {},
      matchedCategory: category || null
    }
  }

  /**
   * Check application series requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkApplicationSeriesRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'application_series')

    // Require endYear for year-aware evaluation
    if (opts.endYear == null) {
      return {
        type: 'application_series',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    // Resolve age-based thresholds if ageCategories are defined
    const age = this.getAgeAtYear(opts.endYear)
    const { thresholds: resolvedThresholds, matchedCategory } = this.resolveAgeBasedApplicationThresholdsWithCategory(req, age)

    const passes = (a) => {
      const g = a.weaponGroup || 'A'
      const th = resolvedThresholds?.[g]
      if (!th) return false
      const hasTime = typeof a.timeSeconds === 'number' && a.timeSeconds > 0
      const hasHits = typeof a.hits === 'number' && a.hits >= 0
      const timeOk = typeof th.maxTimeSeconds === 'number' ? a.timeSeconds <= th.maxTimeSeconds : true
      const hitsOk = typeof th.minHits === 'number' ? a.hits >= th.minHits : true
      return hasTime && hasHits && timeOk && hitsOk
    }

    // Evaluate with a fixed end year, constrain the data to that year/window
    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === opts.endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = opts.endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
    } else {
      achievements = all.filter(a => a.year === opts.endYear)
    }

    const candidates = achievements.filter(passes)
    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    // Include ageCategories for UI display if they exist
    const hasAgeCategories = Array.isArray(req.ageCategories) && req.ageCategories.length > 0

    return {
      type: 'application_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? opts.endYear : null,
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean),
      ...(age != null ? { age } : {}),
      ...(hasAgeCategories ? { ageCategories: req.ageCategories, matchedAgeCategory: matchedCategory?.name || null } : {})
    }
  }

  /**
   * Resolve thresholds based on age categories for application series
   * @param {Object} req - Requirement specification with optional ageCategories
   * @param {number|null} age - Age at end of year, or null if unknown
   * @returns {Object} Resolved thresholds object
   */
  resolveAgeBasedApplicationThresholds(req, age) {
    return this.resolveAgeBasedApplicationThresholdsWithCategory(req, age).thresholds
  }

  /**
   * Resolve thresholds based on age categories, returning both thresholds and matched category
   * @param {Object} req - Requirement specification with optional ageCategories
   * @param {number|null} age - Age at end of year, or null if unknown
   * @returns {{thresholds: Object, matchedCategory: Object|null}} Resolved thresholds and category
   */
  resolveAgeBasedApplicationThresholdsWithCategory(req, age) {
    // If no ageCategories or age is unknown, use base thresholds
    if (!Array.isArray(req.ageCategories) || req.ageCategories.length === 0 || age == null) {
      return { thresholds: req.thresholds || {}, matchedCategory: null }
    }

    // Find matching age category
    const category = req.ageCategories.find(c => {
      const min = typeof c.ageMin === 'number' ? c.ageMin : 0
      const max = typeof c.ageMax === 'number' ? c.ageMax : 999
      return age >= min && age <= max
    })

    // Return category thresholds if found, otherwise base thresholds
    return {
      thresholds: category?.thresholds || req.thresholds || {},
      matchedCategory: category || null
    }
  }

  checkRunningShootingCourseRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'running_shooting_course')
    const endYear = (opts && typeof opts.endYear === 'number') ? opts.endYear : null
    if (endYear == null) {
      return {
        type: 'running_shooting_course',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    const sex = this.profile?.sex
    if (sex !== 'male' && sex !== 'female') {
      throw new Error('Profile sex is required for running_shooting_course requirements')
    }

    const age = this.getAgeAtYear(endYear)
    if (age == null) {
      throw new Error('Profile dateOfBirth is required for running_shooting_course requirements')
    }

    const pickCategory = () => {
      const cats = Array.isArray(req.ageCategories) ? req.ageCategories : []
      if (!cats.length) return null
      return cats.find(c => {
        const min = typeof c.ageMin === 'number' ? c.ageMin : 0
        const max = typeof c.ageMax === 'number' ? c.ageMax : 999
        return age >= min && age <= max
      }) || null
    }

    const category = pickCategory()
    const maxPoints =
      (category?.maxPoints && typeof category.maxPoints === 'object' ? category.maxPoints[sex] : undefined) ??
      (req?.maxPoints && typeof req.maxPoints === 'object' ? req.maxPoints[sex] : undefined)

    if (!Number.isFinite(maxPoints)) {
      throw new Error('running_shooting_course requirement is missing maxPoints for profile sex')
    }

    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= endYear)
    } else {
      achievements = all.filter(a => a.year === endYear)
    }

    const candidates = achievements.filter(a => typeof a.points === 'number' && Number.isFinite(a.points) && a.points <= maxPoints)
    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'running_shooting_course',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? endYear : null,
      maxPoints,
      sex,
      age,
      ...(category?.name ? { ageCategory: category.name } : {}),
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean)
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
      case 'running_shooting_course':
        leaf = this.checkRunningShootingCourseRequirement(req, -1, opts)
        break
      case 'sustained_achievement':
        leaf = this.checkSustainedAchievementRequirement(req, -1, medal, opts)
        break
      case 'cumulative_competition_score':
        leaf = this.checkCumulativeCompetitionScoreRequirement(req, -1, opts)
        break
      case 'standard_medal':
        leaf = this.checkStandardMedalRequirement(req, -1, opts)
        break
      case 'sustained_reference':
        leaf = this.checkSustainedReferenceRequirement(req, -1, medal, opts)
        break
      case 'custom_criterion':
        leaf = this.checkCustomCriterionRequirement(req, -1, opts)
        break
      case 'shooting_round':
        leaf = this.checkShootingRoundRequirement(req, -1, opts)
        break
      case 'speed_shooting_series':
        leaf = this.checkSpeedShootingSeriesRequirement(req, -1, opts)
        break
      case 'competition_performance':
        leaf = this.checkCompetitionPerformanceRequirement(req, -1, opts)
        break
      case 'air_pistol_precision':
        leaf = this.checkAirPistolPrecisionRequirement(req, -1, opts)
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

  /**
   * Get all achievement IDs that contributed to unlocking a medal
   * Walks the evaluated requirement tree and collects matchingAchievementIds from met leaves
   * @param {string} medalId - Medal ID to evaluate
   * @param {number} year - Year to evaluate for
   * @returns {string[]} Array of unique achievement IDs
   */
  getContributingAchievements(medalId, year) {
    const medal = this.medals.getMedalById(medalId)
    if (!medal) return []

    try {
      const reqCheck = this.checkRequirements(medal, { endYear: year })
      if (!reqCheck.allMet) return []

      const ids = new Set()
      const collectIds = (node) => {
        if (!node) return
        if (node.node === 'leaf' && node.leaf?.isMet) {
          const matching = node.leaf.matchingAchievementIds || []
          for (const id of matching) {
            if (id) ids.add(id)
          }
        }
        for (const ch of node.children || []) {
          collectIds(ch)
        }
      }
      collectIds(reqCheck.tree)
      return Array.from(ids)
    } catch {
      return []
    }
  }

  // Candidate end years to try when no specific endYear is provided
  getCandidateYearsForTree() {
    const years = new Set(this.getAllAchievementYears())
    const current = new Date().getFullYear()
    years.add(current)
    return Array.from(years).sort((a, b) => b - a)
  }

  /**
   * Compute age at the end of a given calendar year (Dec 31).
   * Returns null if dateOfBirth is missing or invalid.
   */
  getAgeAtYear(year) {
    const dobStr = this.profile?.dateOfBirth
    if (!dobStr) return null
    const dob = new Date(dobStr)
    if (Number.isNaN(dob.getTime())) return null
    const refDate = new Date(year, 11, 31)
    let age = refDate.getFullYear() - dob.getFullYear()
    const monthDiff = refDate.getMonth() - dob.getMonth()
    const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dob.getDate())
    if (beforeBirthday) age -= 1
    return age
  }

  /**
   * Resolve sustained references based on DSL:
   * - Array of refs (strings or { medalId }) => normalized array
   * - Object with { when: [{ if: { age: {...} }, refs: [...] }], otherwise: [...] }
   *     Evaluate first matching rule (by age at endYear); else use otherwise.
   * - If no references selected, fall back to same-type prerequisite inference.
   */
  resolveSustainedReferences(req, parentMedal, endYear) {
    const refsConfig = req?.references ?? parentMedal?.references
    const normalizeRefs = (arr) =>
      (arr || [])
        .map(r => (typeof r === 'string' ? { medalId: r } : r))
        .filter(r => r && r.medalId)

    if (Array.isArray(refsConfig)) {
      const out = normalizeRefs(refsConfig)
      if (out.length === 0) {
        throw new Error('sustained_achievement.references must list at least one medalId')
      }
      return out
    }

    if (refsConfig && typeof refsConfig === 'object') {
      const whenRules = Array.isArray(refsConfig.when) ? refsConfig.when : null
      let selected = null

      if (whenRules) {
        const age = this.getAgeAtYear(endYear)
        for (const rule of whenRules) {
          if (!rule || typeof rule !== 'object') continue
          const cond = rule.if || {}
          let match = true

          if (cond && Object.prototype.hasOwnProperty.call(cond, 'age')) {
            const ag = cond.age || {}
            if (age == null) {
              match = false
            } else {
              if (ag.gte != null && !(age >= ag.gte)) match = false
              if (ag.gt != null && !(age > ag.gt)) match = false
              if (ag.lte != null && !(age <= ag.lte)) match = false
              if (ag.lt != null && !(age < ag.lt)) match = false
              if (ag.eq != null && !(age === ag.eq)) match = false
            }
          } else {
            match = false
          }

          if (match) {
            selected = rule.refs
            break
          }
        }
      }

      if (!selected && refsConfig.otherwise) {
        selected = refsConfig.otherwise
      }

      if (selected) {
        const out = normalizeRefs(selected)
        if (out.length === 0) {
          throw new Error('sustained_achievement.references rule must provide at least one medalId')
        }
        return out
      }
      // fall through to same-type inference
    } else if (refsConfig != null) {
      throw new Error('Invalid sustained_achievement.references: expected array or object')
    }

    // Fallback: infer from same-type prerequisite chain
    const inferredIds = this.getSameTypePrereqMedalIds(parentMedal)
    return inferredIds.map(id => ({ medalId: id }))
  }

  checkSustainedReferenceRequirement(req, index, parentMedal, opts = {}) {
    const y = opts && typeof opts.endYear === 'number' ? opts.endYear : null
    if (y == null) {
      return {
        type: 'sustained_reference',
        index,
        isMet: false,
        description: req.description,
        windowYear: null,
        reason: 'end_year_required'
      }
    }
    const refs = this.resolveSustainedReferences(req, parentMedal, y)
    if (!Array.isArray(refs) || refs.length === 0) {
      throw new Error('sustained_reference.references must resolve to at least one medalId')
    }
    const extra = Number.isFinite(opts.minStartYear) ? { minStartYear: opts.minStartYear } : {}
    const ok = refs.every(ref => this.requirementsMetInYear(ref.medalId, y, extra))
    return {
      type: 'sustained_reference',
      index,
      isMet: ok,
      description: req.description,
      windowYear: ok ? y : null
    }
  }

  checkSustainedAchievementRequirement(req, index, parentMedal, opts = {}) {
    const minYears = req.yearsOfAchievement ?? 3

    const featureEnforce = this.profile?.features?.enforceCurrentYearForSustained === true
    // If feature is ON, always use the real current year (ignore opts.endYear)
    const currentYear = featureEnforce
      ? new Date().getFullYear()
      : ((opts && typeof opts.endYear === 'number') ? opts.endYear : new Date().getFullYear())

    // Per-year requirement evaluation branch (clean DSL)
    if (req && req.perYear) {
      const earliestCountingYear = this.getEarliestCountingYearForMedal(parentMedal)
      let requireCurrent = req.mustIncludeCurrentYear === true
      if (featureEnforce) requireCurrent = true

      // Candidate years: all achievement years plus current year
      let allYears = this.getAllAchievementYears()
      if (!allYears.includes(currentYear)) allYears.push(currentYear)
      allYears = allYears.sort((a, b) => a - b)

      if (typeof earliestCountingYear === 'number') {
        allYears = allYears.filter(y => y >= earliestCountingYear)
      }
      if (requireCurrent) {
        allYears = allYears.filter(y => y <= currentYear)
      }

      const perYearRoot = this.normalizeRequirementSpec(req.perYear)
      const extra = typeof earliestCountingYear === 'number' ? { minStartYear: earliestCountingYear } : {}
      const qualifyingYears = allYears.filter(y => {
        const tree = this.evaluateReqNode(perYearRoot, parentMedal, { ...opts, endYear: y, ...extra })
        return !!tree.isMet
      })
      const qualifyingYearsSet = new Set(qualifyingYears)

      let progress, met, windowYear = null
      if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 0) {
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
        progress = { current: bestCount, required: req.yearsOfAchievement ?? 1 }
        met = bestCount >= (req.yearsOfAchievement ?? 1)
        windowYear = met ? bestEndYear : null
      } else {
        const total = qualifyingYearsSet.size
        progress = { current: total, required: req.yearsOfAchievement ?? 1 }
        met = total >= (req.yearsOfAchievement ?? 1)
        if (met && requireCurrent && !qualifyingYearsSet.has(currentYear)) {
          met = false
        }
      }

      const uiEndYear = met ? (windowYear ?? currentYear) : currentYear
      const perYearUiTree = this.evaluateReqNode(perYearRoot, parentMedal, { ...opts, endYear: uiEndYear, ...extra })
      return {
        type: 'sustained_achievement',
        index,
        isMet: met,
        progress,
        description: req.description,
        windowYear,
        subtree: perYearUiTree,
        subtreeYear: uiEndYear
      }
    }

    // Resolve which referenced medals to use (supports conditional references by age)
    const effectiveReferences = this.resolveSustainedReferences(req, parentMedal, currentYear)

    // Earliest counting year must be after previous same-type medal unlock
    const earliestCountingYear = this.getEarliestCountingYearForMedal(parentMedal)

    // By default, when using references, the current year must be included
    let requireCurrent =
      req.mustIncludeCurrentYear === true ||
      parentMedal?.mustIncludeCurrentYear === true ||
      (effectiveReferences && effectiveReferences.length > 0)
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
      const qualifies = (y) => effectiveReferences.every(ref => this.requirementsMetInYear(ref.medalId, y, typeof earliestCountingYear === 'number' ? { minStartYear: earliestCountingYear } : {}))
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

  checkCustomCriterionRequirement(req, index, opts = {}) {
    const endYear = opts && typeof opts.endYear === 'number' ? opts.endYear : null
    const fn = CUSTOM_CRITERIA.get(req.name)
    if (!fn) {
      return {
        type: 'custom_criterion',
        index,
        isMet: false,
        description: req.description,
        reason: 'unknown_custom_criterion'
      }
    }
    try {
      const result = fn({
        profile: this.profile,
        medalsDb: this.medals,
        endYear,
        minStartYear: Number.isFinite(opts.minStartYear) ? opts.minStartYear : undefined,
        params: req.params ?? {}
      })
      const ok = !!(result && (typeof result === 'object' ? result.isMet : result))
      return {
        type: 'custom_criterion',
        index,
        isMet: ok,
        description: req.description,
        windowYear: ok && endYear != null ? endYear : null
      }
    } catch (e) {
      return {
        type: 'custom_criterion',
        index,
        isMet: false,
        description: req.description,
        error: e?.message
      }
    }
  }

  checkStandardMedalRequirement(req, index, opts = {}) {
    const achievements = (this.profile.prerequisites || []).filter(a => a.type === 'standard_medal')

    let list = achievements
    if (req.disciplineType) {
      list = list.filter(a => a.disciplineType === req.disciplineType)
    }
    if (req.medalTier) {
      list = list.filter(a => a.medalType === req.medalTier)
    }

    const endYear = (opts && typeof opts.endYear === 'number') ? opts.endYear : null
    if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 0) {
      const finalYear = endYear != null ? endYear : new Date().getFullYear()
      const start0 = finalYear - req.timeWindowYears + 1
      const windowStart = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
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
      windowYear: met && endYear != null ? endYear : null,
      matchingAchievementIds: list.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  /**
   * Check cumulative competition score requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkCumulativeCompetitionScoreRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'competition_result')

    const endYear = (opts && typeof opts.endYear === 'number') ? opts.endYear : null

    // Require endYear for year-aware evaluation
    if (endYear == null) {
      return {
        type: 'cumulative_competition_score',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    const filterByDiscipline = (list) => {
      let filtered = (list || []).filter(a => a.disciplineType === req.disciplineType)
      // Apply competitionType filter if specified (e.g., "rikstavlingen")
      if (req.competitionType) {
        filtered = filtered.filter(a => a.competitionType === req.competitionType)
      }
      return filtered
    }

    const evaluateForEndYear = (endYear) => {
      let list = filterByDiscipline(all)

      if (endYear != null) {
        if (typeof req.timeWindowYears === 'number' && req.timeWindowYears > 0) {
          const start0 = endYear - req.timeWindowYears + 1
          const windowStart = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
          list = list.filter(a => (a.year ?? 0) >= windowStart && (a.year ?? 0) <= endYear)
        } else {
          list = list.filter(a => a.year === endYear)
        }
      }

      let matches = []
      if (req.disciplineType === 'ppc') {
        // Thresholds keyed by PPC class (e.g. R1500, P1500, Open, ...)
        matches = list.filter(a => {
          const cls = a.ppcClass
          const th = req.pointThreshold?.[cls]?.min
          return typeof a.score === 'number' && typeof th === 'number' && a.score >= th
        })
      } else if (req.seriesBasedThresholds) {
        // Thresholds based on number of series shot (e.g., 6, 7, or 10 series)
        matches = list.filter(a => {
          // Filter by competitionType if specified
          if (req.competitionType && a.competitionType !== req.competitionType) {
            return false
          }
          const seriesCount = String(a.seriesCount || '')
          const g = a.weaponGroup || 'A'
          const thresholdSet = req.seriesBasedThresholds[seriesCount]
          if (!thresholdSet) return false
          const th = thresholdSet[g]?.min
          return typeof a.score === 'number' && typeof th === 'number' && a.score >= th
        })
      } else {
        // Standard thresholds keyed by weapon group (A/B/C/R)
        matches = list.filter(a => {
          const g = a.weaponGroup || 'A'
          const th = req.pointThresholds?.[g]?.min
          return typeof a.score === 'number' && typeof th === 'number' && a.score >= th
        })
      }

      return matches
    }

    const required = req.minCompetitions ?? 1
    const matches = evaluateForEndYear(endYear)
    const met = matches.length >= required

    return {
      type: 'cumulative_competition_score',
      index,
      isMet: met,
      progress: { current: matches.length, required },
      description: req.description,
      windowYear: met ? endYear : null,
      matchingAchievementIds: matches.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  checkShootingRoundRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'shooting_round')

    const endYear = (opts && typeof opts.endYear === 'number') ? opts.endYear : null
    if (endYear == null) {
      return {
        type: 'shooting_round',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= endYear)
    } else {
      achievements = all.filter(a => a.year === endYear)
    }

    // Filter by weapon group and total points threshold
    const candidates = achievements.filter(a => {
      const g = a.weaponGroup || 'A'
      const th = req.totalPointThresholds?.[g]?.min
      return typeof a.totalPoints === 'number' && typeof th === 'number' && a.totalPoints >= th
    })

    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'shooting_round',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? endYear : null,
      totalPointThresholds: req.totalPointThresholds,
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  /**
   * Check speed shooting series requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkSpeedShootingSeriesRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'speed_shooting_series')

    // Require endYear for year-aware evaluation
    if (opts.endYear == null) {
      return {
        type: 'speed_shooting_series',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    // Evaluate with a fixed end year, constrain the data to that year/window
    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === opts.endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = opts.endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
    } else {
      achievements = all.filter(a => a.year === opts.endYear)
    }

    const candidates = this.filterBySpeedShootingThreshold(achievements, req)
    const required = req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'speed_shooting_series',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? opts.endYear : null,
      pointThresholds: {
        A: req.pointThresholds?.A?.min,
        B: req.pointThresholds?.B?.min,
        C: req.pointThresholds?.C?.min,
        R: req.pointThresholds?.R?.min
      },
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  /**
   * Check competition performance requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkCompetitionPerformanceRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'competition_performance')

    // Require endYear for year-aware evaluation
    if (opts.endYear == null) {
      return {
        type: 'competition_performance',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    // Evaluate with a fixed end year, constrain the data to that year/window
    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === opts.endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = opts.endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
    } else {
      achievements = all.filter(a => a.year === opts.endYear)
    }

    const candidates = this.filterByCompetitionPerformanceThreshold(achievements, req)
    const required = req.minCompetitions ?? req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'competition_performance',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? opts.endYear : null,
      disciplineType: req.disciplineType,
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  /**
   * Check air pistol precision requirement for a specific year
   * @param {Object} req - Requirement specification
   * @param {number} index - Requirement index
   * @param {Object} opts - Options
   * @param {number} opts.endYear - REQUIRED: Year to evaluate requirement for
   * @param {number} [opts.minStartYear] - Optional minimum start year for time windows
   * @returns {Object} Requirement check result with reason: 'end_year_required' if endYear not provided
   */
  checkAirPistolPrecisionRequirement(req, index, opts = {}) {
    const all = (this.profile.prerequisites || []).filter(a => a.type === 'air_pistol_precision')

    // Require endYear for year-aware evaluation
    if (opts.endYear == null) {
      return {
        type: 'air_pistol_precision',
        index,
        isMet: false,
        description: req.description,
        reason: 'end_year_required',
        windowYear: null
      }
    }

    // Evaluate with a fixed end year, constrain the data to that year/window
    let achievements = all
    const tw = req.timeWindowYears
    if (tw === 1) {
      achievements = all.filter(a => a.year === opts.endYear)
    } else if (typeof tw === 'number' && tw > 1) {
      const start0 = opts.endYear - tw + 1
      const start = Math.max(start0, Number.isFinite(opts.minStartYear) ? opts.minStartYear : start0)
      achievements = all.filter(a => (a.year ?? 0) >= start && (a.year ?? 0) <= opts.endYear)
    } else {
      achievements = all.filter(a => a.year === opts.endYear)
    }

    const candidates = this.filterByAirPistolThreshold(achievements, req)
    const required = req.minSeries ?? req.minAchievements ?? 1
    const progress = { current: candidates.length, required }
    const met = progress.current >= required

    return {
      type: 'air_pistol_precision',
      index,
      isMet: met,
      progress,
      description: req.description,
      windowYear: met ? opts.endYear : null,
      minPointsPerSeries: req.minPointsPerSeries,
      matchingAchievementIds: candidates.slice(0, required).map(a => a.id).filter(Boolean)
    }
  }

  filterByCompetitionPerformanceThreshold(list, req) {
    return (list || []).filter(a => {
      // Must match discipline type if specified
      if (req.disciplineType && a.disciplineType !== req.disciplineType) {
        return false
      }

      // For running/skiing: check maxPoints (lower is better)
      if (req.maxPoints) {
        const sex = this.profile.sex || 'male'
        const maxAllowed = req.maxPoints[sex]
        if (typeof maxAllowed === 'number' && typeof a.points === 'number') {
          return a.points <= maxAllowed
        }
        return false
      }

      // For field: check pointThresholdPercent (higher is better, percentage of max)
      if (req.pointThresholdPercent) {
        const group = a.weaponGroup || 'A'
        const minPercent = req.pointThresholdPercent[group]?.min ?? 0
        if (typeof a.scorePercent === 'number') {
          return a.scorePercent >= minPercent
        }
        // Fallback: if we have score and maxScore, calculate percentage
        if (typeof a.score === 'number' && typeof a.maxScore === 'number' && a.maxScore > 0) {
          const percent = (a.score / a.maxScore) * 100
          return percent >= minPercent
        }
        return false
      }

      return true
    })
  }

  filterByAirPistolThreshold(list, req) {
    const minPoints = req.minPointsPerSeries ?? 0
    return (list || []).filter(a => {
      return typeof a.points === 'number' && a.points >= minPoints
    })
  }

  filterBySpeedShootingThreshold(list, req) {
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

  evaluateAllMedals() {
    const allMedals = this.medals.getAllMedals()
    const results = { unlocked: [], eligible: [], available: [], locked: [] }

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
        if (res && res.status === 'eligible') {
          eligible.push(y)
        }
      } catch {
        // ignore evaluation errors for candidate years
      }
    }
    return eligible
  }
}
