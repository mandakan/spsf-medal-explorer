import React, { createContext, useState, useEffect } from 'react'
import { MedalDatabase } from '../models/Medal'
import medalsData from '../data/medals.json'

/**
 * React context for medal database
 * Provides medal data to all components
 */
export const MedalContext = createContext(null)

export function MedalProvider({ children }) {
  const [medalDatabase, setMedalDatabase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Initialize medal database on mount
    try {
      const db = new MedalDatabase(medalsData)
      setMedalDatabase(db)
      setError(null)
    } catch (err) {
      setError(`Failed to load medal database: ${err.message}`)
      console.error('Medal database error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <MedalContext.Provider value={{ medalDatabase, loading, error }}>
      {children}
    </MedalContext.Provider>
  )
}
