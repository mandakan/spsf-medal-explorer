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
 * Load all medal data files and merge into single dataset.
 * Supports both new multi-file structure and legacy single file.
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
      console.warn('Failed to load multi-file medal data, falling back to legacy:', error)
    }
  }

  // Fallback to legacy single file
  const legacy = await import('../data/medals.json')
  return legacy.default || legacy
}
