/**
 * Utility functions for extracting default values from medal requirements
 * to pre-populate achievement entry forms with minimum required values.
 */

/**
 * Recursively find a requirement node of a specific type in medal requirements
 * @param {object|array} requirements - Medal requirements tree (can be array or object)
 * @param {string} type - Achievement type to find (e.g., 'application_series')
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {object|null} Requirement node or null if not found
 */
function findRequirementByType(requirements, type, maxDepth = 20) {
  if (!requirements) return null

  function traverse(node, depth = 0) {
    if (!node) return null
    if (depth >= maxDepth) return null

    // Handle arrays (requirements can be an array at root or nested level)
    if (Array.isArray(node)) {
      for (const child of node) {
        const result = traverse(child, depth + 1)
        if (result) return result
      }
      return null
    }

    // Must be an object from here
    if (typeof node !== 'object') return null

    // If this node matches the type, return it
    if (node.type === type) return node

    // Recursively traverse nested requirements
    if (node.and && Array.isArray(node.and)) {
      for (const child of node.and) {
        const result = traverse(child, depth + 1)
        if (result) return result
      }
    }
    if (node.or && Array.isArray(node.or)) {
      for (const child of node.or) {
        const result = traverse(child, depth + 1)
        if (result) return result
      }
    }

    return null
  }

  return traverse(requirements)
}

/**
 * Extract default values for application_series form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @returns {object} Default form values
 */
export function getApplicationSeriesDefaults(medal) {
  const requirement = findRequirementByType(medal?.requirements, 'application_series')
  if (!requirement) {
    return {
      weaponGroup: 'A',
      hits: '',
      timeSeconds: '',
    }
  }

  // Get thresholds for weapon group A (most common)
  const weaponGroup = 'A'
  const threshold = requirement.thresholds?.[weaponGroup]

  return {
    weaponGroup,
    hits: threshold?.minHits ?? '',
    timeSeconds: threshold?.maxTimeSeconds ?? '',
  }
}

/**
 * Extract default values for precision_series form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @param {object} profile - User profile (optional, for age-based thresholds)
 * @returns {object} Default form values
 */
export function getPrecisionSeriesDefaults(medal, profile = null) {
  const requirement = findRequirementByType(medal?.requirements, 'precision_series')
  if (!requirement) {
    return {
      weaponGroup: 'A',
      points: '',
    }
  }

  // Get point thresholds for weapon group A
  const weaponGroup = 'A'

  // Check for age-based categories if profile is provided
  let pointThreshold = requirement.pointThresholds?.[weaponGroup]?.min

  if (profile?.dateOfBirth && requirement.ageCategories) {
    const birthYear = new Date(profile.dateOfBirth).getFullYear()
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear

    // Find matching age category
    const ageCategory = requirement.ageCategories.find(cat =>
      age >= (cat.ageMin ?? 0) && age <= (cat.ageMax ?? 999)
    )

    if (ageCategory?.pointThresholds?.[weaponGroup]?.min) {
      pointThreshold = ageCategory.pointThresholds[weaponGroup].min
    }
  }

  return {
    weaponGroup,
    points: pointThreshold ?? '',
  }
}

/**
 * Extract default values for speed_shooting_series form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @returns {object} Default form values
 */
export function getSpeedShootingSeriesDefaults(medal) {
  const requirement = findRequirementByType(medal?.requirements, 'speed_shooting_series')
  if (!requirement) {
    return {
      weaponGroup: 'A',
      points: '',
    }
  }

  // Get point thresholds for weapon group A
  const weaponGroup = 'A'
  const pointThreshold = requirement.pointThresholds?.[weaponGroup]?.min

  return {
    weaponGroup,
    points: pointThreshold ?? '',
  }
}

/**
 * Get a helpful hint text based on medal requirements
 * @param {object} medal - Medal object with requirements
 * @param {string} achievementType - Type of achievement ('application_series', 'precision_series', etc.)
 * @returns {string|null} Hint text or null
 */
export function getRequirementHint(medal, achievementType) {
  const requirement = findRequirementByType(medal?.requirements, achievementType)
  if (!requirement) return null

  // Return the description from the requirement if available
  return requirement.description || null
}

/**
 * Extract default values for competition_performance form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @param {object} profile - User profile (for sex-based thresholds)
 * @returns {object} Default form values
 */
export function getCompetitionPerformanceDefaults(medal, profile = null) {
  const requirement = findRequirementByType(medal?.requirements, 'competition_performance')
  if (!requirement) {
    return {
      disciplineType: '',
      weaponGroup: 'A',
      maxPoints: null,
      thresholds: null,
    }
  }

  const disciplineType = requirement.disciplineType || ''
  const sex = profile?.sex || 'male'

  // For running/skiing: extract maxPoints based on sex
  let maxPoints = null
  if (requirement.maxPoints) {
    maxPoints = requirement.maxPoints[sex] ?? requirement.maxPoints.male ?? null
  }

  // For field: extract pointThresholdPercent
  const thresholds = requirement.pointThresholdPercent || null

  return {
    disciplineType,
    weaponGroup: 'A',
    maxPoints,
    thresholds,
  }
}

/**
 * Extract default values for running_shooting_course or skis_shooting_course form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @param {object} profile - User profile (for sex and age-based thresholds)
 * @param {string} preferredType - Preferred requirement type to look for
 * @returns {object} Default form values
 */
export function getRunningShootingCourseDefaults(medal, profile = null, preferredType = null) {
  // Try to find the requirement - check both types
  let requirement = null
  let foundType = null

  if (preferredType) {
    requirement = findRequirementByType(medal?.requirements, preferredType)
    if (requirement) foundType = preferredType
  }

  if (!requirement) {
    requirement = findRequirementByType(medal?.requirements, 'running_shooting_course')
    if (requirement) foundType = 'running_shooting_course'
  }

  if (!requirement) {
    requirement = findRequirementByType(medal?.requirements, 'skis_shooting_course')
    if (requirement) foundType = 'skis_shooting_course'
  }

  if (!requirement) {
    return {
      maxPoints: null,
      achievementType: 'running_shooting_course',
    }
  }

  const sex = profile?.sex || 'male'
  let maxPoints = requirement.maxPoints?.[sex] ?? requirement.maxPoints?.male ?? null

  // Check for age-based categories if profile has dateOfBirth
  if (profile?.dateOfBirth && requirement.ageCategories) {
    const birthYear = new Date(profile.dateOfBirth).getFullYear()
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear

    // Find matching age category
    const ageCategory = requirement.ageCategories.find(cat =>
      age >= (cat.ageMin ?? 0) && age <= (cat.ageMax ?? 999)
    )

    if (ageCategory?.maxPoints?.[sex]) {
      maxPoints = ageCategory.maxPoints[sex]
    }
  }

  return {
    maxPoints,
    achievementType: foundType,
  }
}

/**
 * Extract default values for air_pistol_precision form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @returns {object} Default form values
 */
export function getAirPistolPrecisionDefaults(medal) {
  const requirement = findRequirementByType(medal?.requirements, 'air_pistol_precision')
  if (!requirement) {
    return {
      minPointsPerSeries: null,
      minSeries: 5,
    }
  }

  return {
    minPointsPerSeries: requirement.minPointsPerSeries ?? null,
    minSeries: requirement.minSeries ?? 5,
  }
}

/**
 * Extract default values for standard_medal form from medal requirements
 * @param {object} medal - Medal object with requirements
 * @returns {object} Default form values
 */
export function getStandardMedalDefaults(medal) {
  const requirement = findRequirementByType(medal?.requirements, 'standard_medal')
  if (!requirement) {
    return {
      disciplineType: '',
      medalType: '',
    }
  }

  return {
    disciplineType: requirement.disciplineType || '',
    medalType: requirement.medalType || '',
  }
}

/**
 * Get all weapon groups that have thresholds defined in the requirement
 * @param {object} medal - Medal object with requirements
 * @param {string} achievementType - Type of achievement
 * @returns {string[]} Array of weapon group keys (e.g., ['A', 'B', 'C'])
 */
export function getAvailableWeaponGroups(medal, achievementType) {
  const requirement = findRequirementByType(medal?.requirements, achievementType)
  if (!requirement) return ['A', 'B', 'C', 'R']

  // Check thresholds or pointThresholds depending on requirement type
  const thresholds = requirement.thresholds || requirement.pointThresholds
  if (!thresholds || typeof thresholds !== 'object') {
    return ['A', 'B', 'C', 'R']
  }

  return Object.keys(thresholds).sort()
}
