import React, { useState, useEffect } from 'react'
import { MedalContext } from './medalContext'
import { MedalDatabase } from '../models/Medal'
import { loadBestAvailableData, validatePrerequisites } from '../utils/medalDatabase'

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
    async function init() {
      setLoading(true)
      try {
        const data = await loadBestAvailableData()
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
    return () => { cancelled = true }
  }, [])

  return (
    <MedalContext.Provider value={{ medalDatabase, loading, error }}>
      {children}
    </MedalContext.Provider>
  )
}
