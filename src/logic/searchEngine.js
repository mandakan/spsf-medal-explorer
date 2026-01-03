function normalize(str) {
  return (str || '').toString().toLowerCase()
}

export function matchMedal(medal, term) {
  const t = normalize(term)
  if (!t) return true
  return (
    normalize(medal.displayName).includes(t) ||
    normalize(medal.name).includes(t) ||
    normalize(medal.type).includes(t)
  )
}

export function highlightText(text, term) {
  const t = (term || '').toString()
  const s = (text || '').toString()
  if (!t.trim()) return s
  // escape regex
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'ig')
  return s.replace(re, '<mark>$1</mark>')
}

function getSuggestions(medals, input, limit = 5) {
  const lower = normalize(input)
  if (!lower) return []
  const set = new Set()
  for (const m of medals || []) {
    const dn = normalize(m.displayName)
    if (dn.startsWith(lower)) {
      set.add(m.displayName)
      if (set.size >= limit) break
    }
  }
  return Array.from(set)
}
