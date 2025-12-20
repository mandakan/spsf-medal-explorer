import { useCallback, useMemo, useRef, useState } from 'react'
import { matchMedal } from '../logic/searchEngine'

export function useSearch(medals, searchTerm = '') {
  const [term, setTerm] = useState(searchTerm || '')
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  const results = useMemo(() => {
    if (!term.trim()) return []
    const lowerTerm = term.toLowerCase()
    return (medals || []).filter(medal => matchMedal(medal, lowerTerm))
  }, [medals, term])

  const generateSuggestions = useCallback((input) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      const v = input || ''
      if (!v.trim()) {
        setSuggestions([])
        return
      }
      const lowerInput = v.toLowerCase()
      const unique = new Set()
      ;(medals || []).forEach(medal => {
        const dn = (medal.displayName || '').toLowerCase()
        if (dn.startsWith(lowerInput) && unique.size < 5) {
          unique.add(medal.displayName)
        }
      })
      setSuggestions(Array.from(unique))
    }, 150)
  }, [medals])

  const handleSearchChange = useCallback((value) => {
    setTerm(value)
    generateSuggestions(value)
  }, [generateSuggestions])

  const handleSuggestionSelect = useCallback((suggestion) => {
    setTerm(suggestion)
    setSuggestions([])
  }, [])

  return {
    term,
    results,
    suggestions,
    handleSearchChange,
    handleSuggestionSelect,
    setTerm,
  }
}
