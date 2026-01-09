/**
 * Utility functions for extracting default values from medal requirements
 * to pre-populate achievement entry forms with minimum required values.
 */

/**
 * Recursively find a requirement node of a specific type in medal requirements
 * @param {object} requirements - Medal requirements tree
 * @param {string} type - Achievement type to find (e.g., 'application_series')
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {object|null} Requirement node or null if not found
 */
function findRequirementByType(requirements, type, maxDepth = 20) {
  if (!requirements || typeof requirements !== 'object') return null

  function traverse(node, depth = 0) {
    if (!node || typeof node !== 'object') return null
    if (depth >= maxDepth) return null

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
