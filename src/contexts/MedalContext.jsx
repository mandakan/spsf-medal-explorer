import React, { useState, useEffect } from 'react'
import { MedalDatabase } from '../models/Medal'
import { loadBestAvailableData, validatePrerequisites } from '../utils/medalDatabase'
import { MedalContext } from './medalContext.js'

/**
 * React context for medal database
 * Provides medal data to all components
 */

export function MedalProvider({ children }) {
  const [medalDatabase, setMedalDatabase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function init(overrideData) {
      setLoading(true)
      try {
        const data = overrideData ?? (await loadBestAvailableData())
        const validation = validatePrerequisites(data)
        if (!validation.ok) {
          console.warn('Medal dataset validation errors:', validation.errors)
        }
        const db = new MedalDatabase(data)
        if (!cancelled) {
          setMedalDatabase(db)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load medal database: ${err.message}`)
          console.error('Medal database error:', err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()

    // Hot Module Replacement: rebuild database when data or loader changes during dev
    if (import.meta.hot) {
      import.meta.hot.accept('../data/medals.json', (mod) => {
        if (!cancelled) {
          init(mod?.default)
        }
      })
      import.meta.hot.accept('../utils/medalDatabase', () => {
        if (!cancelled) init()
      })
    }

    return () => { cancelled = true }
  }, [])

  return (
    <MedalContext.Provider value={{ medalDatabase, loading, error }}>
      {children}
    </MedalContext.Provider>
  )
}
