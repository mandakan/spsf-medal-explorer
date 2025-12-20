import { useMemo, useState } from 'react'

function normalize(str) {
  return (str || '').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

export function useMedalSearch(medals = []) {
  const [query, setQuery] = useState('')

  const index = useMemo(() => {
    return medals.map(m => {
      const name = m.displayName || m.name || ''
      const type = m.type || m.medals_type || ''
      const tier = m.tier || ''
      return {
        ref: m,
        haystack: normalize([name, type, tier, m.id].filter(Boolean).join(' '))
      }
    })
  }, [medals])

  const results = useMemo(() => {
    const q = normalize(query).trim()
    if (!q) return medals
    return index
      .filter(entry => entry.haystack.includes(q))
      .map(entry => entry.ref)
  }, [index, query, medals])

  const suggestions = useMemo(() => {
    const q = normalize(query).trim()
    if (!q) return []
    const unique = new Set()
    for (const m of results.slice(0, 10)) {
      const name = m.displayName || m.name
      if (name && !unique.has(name)) unique.add(name)
    }
    return Array.from(unique)
  }, [results, query])

  return {
    query,
    setQuery,
    results,
    suggestions
  }
}
