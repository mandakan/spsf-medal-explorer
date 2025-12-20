/**
 * Utilities for loading and validating medal datasets.
 * Non-invasive: can be adopted by existing providers without breaking changes.
 */

// Normalize ID for maps
function idOf(medal) {
  return medal?.id || medal?.medalId
}

export function buildIdIndex(medals = []) {
  const map = new Map()
  for (const m of medals) {
    const id = idOf(m)
    if (id) map.set(id, m)
  }
  return map
}

export function summarizeDataSet(data) {
  const medals = data?.medals || []
  const idSet = new Set()
  let duplicates = 0
  medals.forEach(m => {
    const id = idOf(m)
    if (!id) return
    if (idSet.has(id)) duplicates++
    idSet.add(id)
  })
  const types = medals.reduce((acc, m) => {
    const t = m.type || m.medals_type || 'unknown'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  return {
    version: data?.version || data?.metadata?.version || 'unknown',
    total: medals.length,
    duplicates,
    types
  }
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
 * Attempt to load the complete dataset; fall back to base medals.json.
 * Consumers can use this in a provider to decide which dataset to expose.
 */
export async function loadBestAvailableData() {
  // Vite/webpack will inline JSON imports; dynamic import guarded with catch.
  try {
    const complete = await import('../data/complete.json')
    if (Array.isArray(complete.default?.medals) && complete.default.medals.length > 0) {
      return complete.default
    }
  } catch {
    // ignore
  }
  const base = await import('../data/medals.json')
  return base.default || base
}
