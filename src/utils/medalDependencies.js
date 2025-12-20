/**
 * Build a dependency index from prerequisite medal -> dependent medal(s).
 * @param {Array} medals - list of Medal instances or plain objects with { id, prerequisites }
 * @returns {Map<string, Set<string>>} Map from prereq medalId to Set of dependent medalIds
 */
export function buildDependencyIndex(medals = []) {
  const index = new Map()
  for (const m of medals) {
    const deps = Array.isArray(m?.prerequisites) ? m.prerequisites : []
    for (const p of deps) {
      if (p && p.type === 'medal' && p.medalId) {
        if (!index.has(p.medalId)) index.set(p.medalId, new Set())
        index.get(p.medalId).add(m.id)
      }
    }
  }
  return index
}

/**
 * Get all descendants (dependents, transitively) of a medal.
 * @param {string} medalId
 * @param {Map<string, Set<string>>} index
 * @returns {Set<string>}
 */
export function getDescendants(medalId, index) {
  const result = new Set()
  if (!medalId || !index) return result
  const queue = [medalId]
  while (queue.length) {
    const id = queue.shift()
    const children = index.get(id)
    if (!children) continue
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child)
        queue.push(child)
      }
    }
  }
  return result
}
