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
