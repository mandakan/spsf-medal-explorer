import { useCallback, useEffect, useState } from 'react'

export function useFilterStorage() {
  const storageKey = 'medal-app-filter-presets'
  const [presets, setPresets] = useState([])

  const safeLoad = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : []
    } catch (err) {
      console.error('Failed to load presets:', err)
      return []
    }
  }, [])

  const reload = useCallback(() => {
    setPresets(safeLoad())
  }, [safeLoad])

  useEffect(() => {
    reload()
  }, [reload])

  const savePreset = useCallback((name, filters) => {
    try {
      const next = [...safeLoad(), { name, filters, createdAt: new Date().toISOString() }]
      localStorage.setItem(storageKey, JSON.stringify(next))
      setPresets(next)
    } catch (err) {
      console.error('Failed to save preset:', err)
    }
  }, [safeLoad])

  const deletePreset = useCallback((index) => {
    try {
      const cur = safeLoad()
      if (index >= 0 && index < cur.length) {
        cur.splice(index, 1)
        localStorage.setItem(storageKey, JSON.stringify(cur))
        setPresets(cur)
      }
    } catch (err) {
      console.error('Failed to delete preset:', err)
    }
  }, [safeLoad])

  return {
    presets,
    savePreset,
    deletePreset,
    reload,
  }
}
