/**
 * Utilities for loading and validating medal datasets.
 * Non-invasive: can be adopted by existing providers without breaking changes.
 */

// Normalize ID for maps
function idOf(medal) {
  return medal?.id || medal?.medalId
}

function buildIdIndex(medals = []) {
  const map = new Map()
  for (const m of medals) {
    const id = idOf(m)
    if (id) map.set(id, m)
  }
  return map
}

export function validatePrerequisites(data) {
  const medals = data?.medals || []
  const errors = []
  const idIndex = buildIdIndex(medals)

  medals.forEach(m => {
    const prereqs = m.prerequisites || []
    prereqs.forEach((p, idx) => {
      if (p?.type === 'medal') {
        const target = p.medalId
        if (!idIndex.has(target)) {
          errors.push(`Medal ${idOf(m)} prerequisite #${idx} references missing medalId: ${target}`)
        }
      }
    })
  })

  return { ok: errors.length === 0, errors }
}

/**
 * Merge multiple medal files into single dataset structure
 * Exported for testing purposes
 * @param {Array<{path: string, data: object}>} files - Array of file objects with path and data
 * @returns {{version: string, medals: Array}} Merged medal dataset
 */
export function mergeAndValidateMedalFiles(files) {
  const allMedals = []
  const fileTypes = new Set()

  for (const { path, data } of files) {
    // Validate file structure
    if (!data.type || !Array.isArray(data.medals)) {
      throw new Error(`Invalid medal file structure in ${path}: missing 'type' or 'medals' array`)
    }

    // Check for duplicate types
    if (fileTypes.has(data.type)) {
      throw new Error(`Duplicate medal type '${data.type}' found in ${path}`)
    }
    fileTypes.add(data.type)

    // Validate all medals in file have correct type
    for (const medal of data.medals) {
      if (medal.type !== data.type) {
        throw new Error(
          `Medal ${medal.id} in ${path} has type '${medal.type}' but file is for '${data.type}'`
        )
      }
    }

    allMedals.push(...data.medals)
  }

  // Return standard format expected by MedalDatabase
  return {
    version: '1.0',
    medals: allMedals
  }
}


/**
 * Load all medal data files and merge into single dataset.
 * Supports both new multi-file structure and legacy single file.
 *
 * Loading strategy:
 * 1. In browser (Vite): Attempts to load all *.medals.json files using import.meta.glob
 * 2. In tests (Jest): Skips multi-file loading (import.meta not supported)
 * 3. On failure: Falls back to legacy medals.json for resilience
 *
 * The fallback is intentional to ensure the app remains functional even if:
 * - Multi-file loading fails due to configuration issues
 * - Running in environments without Vite (e.g., Jest)
 * - Legacy medals.json is the only available source
 *
 * @returns {Promise<{version: string, medals: Array}>} Medal dataset
 */
export async function loadBestAvailableData() {
  // In test environment (Jest), skip multi-file loading and use legacy
  // eslint-disable-next-line no-undef
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'

  if (!isTest) {
    try {
      // Dynamically import Vite-specific loader (only works in Vite environment)
      const { loadAllMedalFiles, mergeAndValidateMedalFiles } = await import('./medalLoader.vite.js')
      const medalFiles = await loadAllMedalFiles()
      if (medalFiles.length > 0) {
        return mergeAndValidateMedalFiles(medalFiles)
      }
    } catch (error) {
      // Log warning but continue - fallback provides resilience
      // This is expected in Jest and acceptable in production (uses legacy data)
      console.warn('[Medal Database] Multi-file loading failed, using legacy medals.json:', error.message)
    }
  }

  // Fallback to legacy single file
  // This path is used in:
  // - Jest/test environment (intentional)
  // - Multi-file loading failure (safety net)
  const legacy = await import('../data/medals.json')
  return legacy.default || legacy
}
