import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'medal-app-current-filters'

export function useFilter(medals, initialFilters = {}) {
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : null
      return {
        status: null,
        tier: null,
        type: null,
        weaponGroup: null,
        search: '',
        ...(parsed || {}),
        ...initialFilters,
      }
    } catch {
      return {
        status: null,
        tier: null,
        type: null,
        weaponGroup: null,
        search: '',
        ...initialFilters,
      }
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch {
      // ignore
    }
  }, [filters])

  const filteredMedals = useMemo(() => {
    if (!Array.isArray(medals)) return []
    return medals.filter(medal => {
      if (filters.tier && medal.tier !== filters.tier) return false
      if (filters.type && medal.type !== filters.type) return false
      if (filters.weaponGroup && medal.weaponGroup !== filters.weaponGroup) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matches =
          (medal.displayName || '').toLowerCase().includes(searchLower) ||
          (medal.name || '').toLowerCase().includes(searchLower) ||
          (medal.type || '').toLowerCase().includes(searchLower)
        if (!matches) return false
      }
      return true
    })
  }, [medals, filters])

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const setAllFilters = useCallback((next) => {
    setFilters(prev => ({ ...prev, ...(next || {}) }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: null,
      tier: null,
      type: null,
      weaponGroup: null,
      search: '',
    })
  }, [])

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(v => v !== null && v !== ''),
    [filters]
  )

  return {
    filters,
    filteredMedals,
    setFilter,
    setFilters: setAllFilters,
    clearAllFilters,
    hasActiveFilters,
  }
}
