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
 * Load the normalized medals dataset (name + tierName).
 */
export async function loadBestAvailableData() {
  const base = await import('../data/medals.json')
  return base.default || base
}
