export const DEFAULT_LAYOUT_ID = 'timeline'

const layouts = new Map()

export function registerLayout(def) {
  if (!def || typeof def !== 'object') {
    throw new Error('registerLayout: def must be an object')
  }
  const { id, generator } = def
  if (!id || typeof id !== 'string') {
    throw new Error('registerLayout: def.id must be a non-empty string')
  }
  if (typeof generator !== 'function') {
    throw new Error(`registerLayout: def.generator must be a function (id: ${id})`)
  }
  if (layouts.has(id)) {
    throw new Error(`registerLayout: layout id already registered: ${id}`)
  }
  layouts.set(id, def)
}

export function getLayout(id) {
  if (id && layouts.has(id)) return layouts.get(id)
  return layouts.get(DEFAULT_LAYOUT_ID) || null
}

export function listLayouts() {
  return Array.from(layouts.values()).map(l => ({
    id: l.id,
    label: l.label,
    description: l.description || '',
  }))
}
